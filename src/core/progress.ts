import { INGREDIENTS, STARTER_INGREDIENTS, type IngredientId } from '../content/ingredients';
import { MAGNETS, type MagnetId } from '../content/magnets';
import { STICKERS, type StickerId } from '../content/stickers';
import { STARTER_TOOLS, TOOLS, type ToolId } from '../content/tools';
import type { VehicleId } from '../content/vehicles';
import { newTrack, sanitizeTrack, type Track } from './difficulty';
import type { ActivityId, Progress, ToolStat } from './storage';

/** Progress rules, as functions that update a Progress record in place. */

const RECENT_CAP = 6;
/** An item counts as known once its last this-many answers were right first time. */
const KNOWN_AFTER = 2;

/**
 * Things he learns a few at a time (tools, ingredients): starting with a few,
 * adding the next once he knows every one in play.
 */
interface ItemSet<T extends string> {
  ids: readonly T[];
  starter: number;
  stats(p: Progress): Partial<Record<T, ToolStat>>;
  introduced(p: Progress): number;
  setIntroduced(p: Progress, n: number): void;
}

const TOOL_SET: ItemSet<ToolId> = {
  ids: TOOLS.map((t) => t.id),
  starter: STARTER_TOOLS,
  stats: (p) => p.tools,
  introduced: (p) => p.toolsIntroduced,
  setIntroduced: (p, n) => (p.toolsIntroduced = n),
};

const INGREDIENT_SET: ItemSet<IngredientId> = {
  ids: INGREDIENTS.map((i) => i.id),
  starter: STARTER_INGREDIENTS,
  stats: (p) => p.ingredients,
  introduced: (p) => p.ingredientsIntroduced,
  setIntroduced: (p, n) => (p.ingredientsIntroduced = n),
};

function recordAnswer<T extends string>(set: ItemSet<T>, p: Progress, id: T, firstTry: boolean): void {
  const stats = set.stats(p);
  const stat = stats[id] ?? { asked: 0, firstTry: 0, recent: [] };
  stat.asked++;
  if (firstTry) stat.firstTry++;
  stat.recent = [...stat.recent, firstTry].slice(-RECENT_CAP);
  stats[id] = stat;
}

function introducedCount<T extends string>(set: ItemSet<T>, p: Progress): number {
  return Math.min(set.ids.length, Math.max(set.starter, Math.floor(set.introduced(p)) || set.starter));
}

function pool<T extends string>(set: ItemSet<T>, p: Progress): T[] {
  return set.ids.slice(0, introducedCount(set, p));
}

function knows<T extends string>(set: ItemSet<T>, p: Progress, id: T): boolean {
  const recent = set.stats(p)[id]?.recent ?? [];
  return recent.length >= KNOWN_AFTER && recent.slice(-KNOWN_AFTER).every(Boolean);
}

function maybeIntroduce<T extends string>(set: ItemSet<T>, p: Progress): T | null {
  const n = introducedCount(set, p);
  if (n >= set.ids.length) return null;
  if (!pool(set, p).every((id) => knows(set, p, id))) return null;
  set.setIntroduced(p, n + 1);
  return set.ids[n]!;
}

function accuracy<T extends string>(set: ItemSet<T>, p: Progress): { id: T; asked: number; accuracy: number }[] {
  return set.ids.map((id) => {
    const s = set.stats(p)[id];
    return { id, asked: s?.asked ?? 0, accuracy: s && s.asked ? s.firstTry / s.asked : 0 };
  });
}

// Tools (Pops' Workshop)
export const recordToolAnswer = (p: Progress, tool: ToolId, firstTry: boolean) => recordAnswer(TOOL_SET, p, tool, firstTry);
/** The tools the workshop can ask for right now, in introduction order. */
export const toolPool = (p: Progress) => pool(TOOL_SET, p);
export const knowsTool = (p: Progress, tool: ToolId) => knows(TOOL_SET, p, tool);
/** Adds the next tool once he knows every current one; returns it, or null. */
export const maybeIntroduceTool = (p: Progress) => maybeIntroduce(TOOL_SET, p);
/** First-try accuracy per tool (0..1), for the parent menu. */
export const toolAccuracy = (p: Progress) => accuracy(TOOL_SET, p);

// Ingredients (Mama's Kitchen)
export const recordIngredientAnswer = (p: Progress, id: IngredientId, firstTry: boolean) => recordAnswer(INGREDIENT_SET, p, id, firstTry);
export const ingredientPool = (p: Progress) => pool(INGREDIENT_SET, p);
export const maybeIntroduceIngredient = (p: Progress) => maybeIntroduce(INGREDIENT_SET, p);
export const ingredientAccuracy = (p: Progress) => accuracy(INGREDIENT_SET, p);

export function recordRound(p: Progress, activity: ActivityId): void {
  p.rounds[activity] = (p.rounds[activity] ?? 0) + 1;
}

/** The sticker the next completed workshop round earns. */
export function nextSticker(p: Progress): StickerId {
  return STICKERS[p.stickers.length % STICKERS.length]!.id;
}

export function awardSticker(p: Progress): StickerId {
  const id = nextSticker(p);
  p.stickers.push(id);
  return id;
}

/** The fridge magnet the next completed kitchen round earns. */
export function awardMagnet(p: Progress): MagnetId {
  const id = MAGNETS[p.magnets.length % MAGNETS.length]!.id;
  p.magnets.push(id);
  return id;
}

/** Parks a fixed vehicle in the garage. Returns 'star' if it was already there. */
export function recordFix(p: Progress, vehicle: VehicleId): 'new' | 'star' {
  const spot = p.garage[vehicle];
  if (spot) {
    spot.stars++;
    return 'star';
  }
  p.garage[vehicle] = { stars: 0 };
  return 'new';
}

export function getTrack(p: Progress, key: string, min: number, max: number): Track {
  const stored = p.difficulty[key];
  return stored ? sanitizeTrack(stored, min, max) : newTrack(min, max);
}

export function setTrack(p: Progress, key: string, t: Track): void {
  p.difficulty[key] = t;
}
