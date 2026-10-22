import { STICKERS, type StickerId } from '../content/stickers';
import { STARTER_TOOLS, TOOLS, type ToolId } from '../content/tools';
import type { VehicleId } from '../content/vehicles';
import { newTrack, sanitizeTrack, type Track } from './difficulty';
import type { ActivityId, Progress } from './storage';

/** Progress rules, as functions that update a Progress record in place. */

const RECENT_CAP = 6;
/** A tool counts as known once its last this-many answers were right first time. */
const KNOWN_AFTER = 2;

export function recordToolAnswer(p: Progress, tool: ToolId, firstTry: boolean): void {
  const stat = p.tools[tool] ?? { asked: 0, firstTry: 0, recent: [] };
  stat.asked++;
  if (firstTry) stat.firstTry++;
  stat.recent = [...stat.recent, firstTry].slice(-RECENT_CAP);
  p.tools[tool] = stat;
}

function introducedCount(p: Progress): number {
  return Math.min(TOOLS.length, Math.max(STARTER_TOOLS, Math.floor(p.toolsIntroduced) || STARTER_TOOLS));
}

/** The tools Fetch the Tool can ask for right now, in introduction order. */
export function toolPool(p: Progress): ToolId[] {
  return TOOLS.slice(0, introducedCount(p)).map((t) => t.id);
}

export function knowsTool(p: Progress, tool: ToolId): boolean {
  const recent = p.tools[tool]?.recent ?? [];
  return recent.length >= KNOWN_AFTER && recent.slice(-KNOWN_AFTER).every(Boolean);
}

/**
 * Adds the next tool once he knows every current one. Returns the new tool,
 * or null if it's not time yet (or all tools are in).
 */
export function maybeIntroduceTool(p: Progress): ToolId | null {
  const n = introducedCount(p);
  if (n >= TOOLS.length) return null;
  if (!toolPool(p).every((t) => knowsTool(p, t))) return null;
  p.toolsIntroduced = n + 1;
  return TOOLS[n]!.id;
}

export function recordRound(p: Progress, activity: ActivityId): void {
  p.rounds[activity] = (p.rounds[activity] ?? 0) + 1;
}

/** The sticker the next completed round earns. */
export function nextSticker(p: Progress): StickerId {
  return STICKERS[p.stickers.length % STICKERS.length]!.id;
}

export function awardSticker(p: Progress): StickerId {
  const id = nextSticker(p);
  p.stickers.push(id);
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

/** First-try accuracy per tool (0..1), for the parent menu. */
export function toolAccuracy(p: Progress): { tool: ToolId; asked: number; accuracy: number }[] {
  return TOOLS.map((t) => {
    const s = p.tools[t.id];
    return { tool: t.id, asked: s?.asked ?? 0, accuracy: s && s.asked ? s.firstTry / s.asked : 0 };
  });
}
