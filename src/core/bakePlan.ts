import { ADD_COUNTS, DECOS, FLAVORS, type AddCount, type BakeItem, type DecoId, type FlavorId } from '../content/bakery';
import { shuffle, type Rng } from './rounds';
import type { Progress } from './storage';

/** The flavor of the next batch: they take turns. */
export function nextFlavor(p: Progress): FlavorId {
  const muffins = p.bakery.filter((b) => b.kind === 'muffin').length;
  return FLAVORS[muffins % FLAVORS.length]!.id;
}

/** How many pieces of fruit to count in, from the counting track (2–5 taps → 2–4 pieces). */
export function addCount(trackValue: number): AddCount {
  return ADD_COUNTS.reduce((best, n) => (n <= trackValue ? n : best), ADD_COUNTS[0]);
}

/** The decorations Mama asks for on one cookie: all different. */
export function planCookie(rng: Rng = Math.random, count = 3): DecoId[] {
  return shuffle(
    DECOS.map((d) => d.id),
    rng,
  ).slice(0, count);
}

/** The target plus distinct distractors, shuffled. */
export function decoChoices(target: DecoId, count: number, rng: Rng = Math.random): DecoId[] {
  const others = shuffle(
    DECOS.map((d) => d.id).filter((d) => d !== target),
    rng,
  ).slice(0, Math.max(0, count - 1));
  return shuffle([target, ...others], rng);
}

/** Puts something he made on the bakery shelf. */
export function addToBakery(p: Progress, item: BakeItem): void {
  p.bakery.push(item);
}
