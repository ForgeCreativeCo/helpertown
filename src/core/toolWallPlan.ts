import { TOOLS, type ToolId } from '../content/tools';
import { shuffle, type Rng } from './rounds';

/**
 * Tool Wall rounds hang 4 tools (5 at the top level). Tools he has met in
 * Fetch the Tool come first; the wall is a shape-matching game, so it can
 * also show him the next tools by name before he's met them.
 */
export function planToolWall(pool: readonly ToolId[], top: boolean, rng: Rng = Math.random): ToolId[] {
  const size = top ? 5 : 4;
  const known = shuffle(pool, rng).slice(0, size);
  const extra = TOOLS.map((t) => t.id).filter((t) => !known.includes(t));
  return shuffle([...known, ...extra.slice(0, size - known.length)], rng);
}

/**
 * Which empty outlines to show for one question: the right one plus up to
 * `choices - 1` others still waiting to be filled.
 */
export function visibleOutlines<T>(target: T, empty: readonly T[], choices: number, rng: Rng = Math.random): T[] {
  const others = shuffle(
    empty.filter((t) => t !== target),
    rng,
  ).slice(0, Math.max(0, choices - 1));
  return [target, ...others];
}
