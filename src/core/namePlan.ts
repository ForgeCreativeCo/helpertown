import { shuffle, type Rng } from './rounds';

/** Name Sign asks for 3 letters at first and up to 5 (the 3–5 questions per round rule). */
export const MIN_GAPS = 3;
export const MAX_GAPS = 5;

/** How many letters he fills in, for a name of `length` letters (short names: all of them). */
export function gapRange(length: number): { min: number; max: number } {
  return { min: Math.min(MIN_GAPS, length), max: Math.min(MAX_GAPS, length) };
}

/**
 * Which letters of his name are missing this round, left to right. The first
 * letter is always one of them; the rest move around from round to round so
 * that over time he places every letter of his name.
 */
export function pickGaps(length: number, count: number, rng: Rng = Math.random): number[] {
  if (length <= 0) return [];
  const n = Math.max(1, Math.min(count, length));
  const rest = shuffle(
    Array.from({ length: length - 1 }, (_, i) => i + 1),
    rng,
  ).slice(0, n - 1);
  return [0, ...rest].sort((a, b) => a - b);
}
