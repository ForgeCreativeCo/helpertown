import { family } from '../config/family';
import type { BakeItem } from '../content/bakery';
import { STARTER_INGREDIENTS, type IngredientId } from '../content/ingredients';
import type { MagnetId } from '../content/magnets';
import type { StickerId } from '../content/stickers';
import type { VehicleId } from '../content/vehicles';
import { STARTER_TOOLS, type ToolId } from '../content/tools';
import type { Track } from './difficulty';

/** Settings and progress, kept in localStorage as one versioned record. */
export const STORAGE_KEY = 'helper-town';
export const SAVE_VERSION = 2;

export type DifficultySetting = 'auto' | 2 | 3 | 4;
export type SessionMinutes = 0 | 10 | 15 | 20 | 30;
export const DIFFICULTIES: readonly DifficultySetting[] = ['auto', 2, 3, 4];
export const SESSION_MINUTES: readonly SessionMinutes[] = [0, 10, 15, 20, 30];

export interface Settings {
  childName: string;
  grandpaName: string;
  difficulty: DifficultySetting;
  /** 0 means no session limit. */
  sessionMinutes: SessionMinutes;
  /** 0..1 */
  voiceVolume: number;
  /** 0..1, kept below the voice by default. */
  sfxVolume: number;
  music: boolean;
}

export type ActivityId = 'fetch' | 'fixit' | 'toolwall' | 'cook' | 'bake' | 'decorate';

export interface ToolStat {
  /** Questions that asked for this tool. */
  asked: number;
  /** Of those, how many he got on the first tap. */
  firstTry: number;
  /** Latest first-try results, newest last (capped). */
  recent: boolean[];
}

export interface Progress {
  /** Milliseconds of active play per local date (YYYY-MM-DD). */
  playMs: Record<string, number>;
  /** Completed rounds per activity. */
  rounds: Partial<Record<ActivityId, number>>;
  tools: Partial<Record<ToolId, ToolStat>>;
  /** How many tools (in TOOLS order) Fetch the Tool uses so far. */
  toolsIntroduced: number;
  /** Adaptive difficulty tracks, keyed like 'fetch.choices'. */
  difficulty: Record<string, Track>;
  /** Earned toolbox stickers, oldest first. */
  stickers: StickerId[];
  /** Fixed vehicles in his garage; fixing one again adds a star. */
  garage: Partial<Record<VehicleId, { stars: number }>>;
  /** Today's play session, for the wind-down. */
  session: SessionData;
  /** Mama's Kitchen: ingredient first-try stats, how many are in play, fridge magnets earned. */
  ingredients: Partial<Record<IngredientId, ToolStat>>;
  ingredientsIntroduced: number;
  magnets: MagnetId[];
  /** Muffins and decorated cookies he made, oldest first (the bakery shelf). */
  bakery: BakeItem[];
}

export interface SessionData {
  /** Local date (YYYY-MM-DD) this session belongs to. */
  date: string;
  /** Active play time in this session. */
  ms: number;
  /** Wound down for the day; the resting screen shows until tomorrow or a grown-up resets it. */
  resting: boolean;
}

export interface SaveData {
  version: number;
  settings: Settings;
  progress: Progress;
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    settings: {
      childName: family.childName,
      grandpaName: family.grandpaNames[0],
      difficulty: 'auto',
      sessionMinutes: 15,
      voiceVolume: 1,
      sfxVolume: 0.55,
      music: false,
    },
    progress: { playMs: {}, rounds: {}, tools: {}, toolsIntroduced: STARTER_TOOLS, difficulty: {}, stickers: [], garage: {}, session: { date: '', ms: 0, resting: false }, ingredients: {}, ingredientsIntroduced: STARTER_INGREDIENTS, magnets: [], bakery: [] },
  };
}

/**
 * Upgrades from each older version to the next. Add an entry when SaveData
 * changes shape: MIGRATIONS[n] turns a version-n record into version n+1.
 */
type AnyRecord = Record<string, unknown>;
export const MIGRATIONS: Record<number, (data: AnyRecord) => AnyRecord> = {
  // v1 saves made before the child's name was set stored ''. Pick up the family name.
  1: (data) => {
    const settings = isObject(data.settings) ? data.settings : {};
    return settings.childName === '' ? { ...data, settings: { ...settings, childName: family.childName } } : data;
  },
};

function isObject(v: unknown): v is AnyRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Turns whatever was stored into valid current SaveData. Unknown or broken
 * data never throws: missing fields fall back to defaults.
 */
export function migrate(raw: unknown, migrations = MIGRATIONS, target = SAVE_VERSION): SaveData {
  const base = defaultSave();
  if (!isObject(raw)) return base;
  let data: AnyRecord = raw;
  let version = typeof data.version === 'number' ? data.version : 0;
  if (version > target) return base;
  while (version < target) {
    const step = migrations[version];
    if (step) data = step(data);
    version++;
  }
  const settings = isObject(data.settings) ? data.settings : {};
  const progress = isObject(data.progress) ? data.progress : {};
  const picked = pickValid(settings, base.settings);
  // Fixed-difficulty and session settings have a few allowed values of mixed types.
  if (DIFFICULTIES.includes(settings.difficulty as DifficultySetting)) picked.difficulty = settings.difficulty as DifficultySetting;
  else delete picked.difficulty;
  if (!SESSION_MINUTES.includes(settings.sessionMinutes as SessionMinutes)) delete picked.sessionMinutes;
  return {
    version: target,
    settings: { ...base.settings, ...picked },
    progress: { ...base.progress, ...pickValid(progress, base.progress) },
  };
}

/** Keeps only the fields whose type matches the default's. */
function pickValid<T extends object>(src: AnyRecord, defaults: T): Partial<T> {
  const out: AnyRecord = {};
  for (const [key, def] of Object.entries(defaults)) {
    const v = src[key];
    if (v === undefined) continue;
    if (typeof v === typeof def && Array.isArray(v) === Array.isArray(def)) out[key] = v;
  }
  return out as Partial<T>;
}

type KV = Pick<Storage, 'getItem' | 'setItem'>;

export class Store {
  data: SaveData;
  private kv: KV | null;

  constructor(kv: KV | null = safeLocalStorage()) {
    this.kv = kv;
    this.data = migrate(this.read());
  }

  private read(): unknown {
    try {
      const text = this.kv?.getItem(STORAGE_KEY);
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  save(): void {
    try {
      this.kv?.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage full or blocked: the game keeps going with in-memory state.
    }
  }

  get settings(): Settings {
    return this.data.settings;
  }

  get progress(): Progress {
    return this.data.progress;
  }

  update(fn: (data: SaveData) => void): void {
    fn(this.data);
    this.save();
  }

  reset(): void {
    const settings = this.data.settings;
    this.data = { ...defaultSave(), settings };
    this.save();
  }
}

function safeLocalStorage(): KV | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Local calendar date as YYYY-MM-DD. */
export function localDate(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
