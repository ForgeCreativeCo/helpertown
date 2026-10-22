import { shuffle, type Rng } from '../core/rounds';

/**
 * The grown-ups check after holding the gear: "Tap the blue square two times"
 * among five colored squares. It needs reading, so random toddler taps fail
 * (two random taps pass 1 time in 25, and only after a 3-second hold).
 */
export const CHECK_COLORS = [
  { id: 'red', label: 'red', hex: '#e4473b' },
  { id: 'blue', label: 'blue', hex: '#3d7fe0' },
  { id: 'green', label: 'green', hex: '#3fae5a' },
  { id: 'yellow', label: 'yellow', hex: '#f2b33d' },
  { id: 'purple', label: 'purple', hex: '#8b5cd6' },
] as const;

export type CheckColor = (typeof CHECK_COLORS)[number]['id'];

export interface CheckState {
  target: CheckColor;
  order: CheckColor[];
  hits: number;
}

export const TAPS_NEEDED = 2;

export function newCheck(rng: Rng = Math.random): CheckState {
  const order = shuffle(
    CHECK_COLORS.map((c) => c.id),
    rng,
  );
  const target = order[Math.floor(rng() * order.length)]!;
  return { target, order, hits: 0 };
}

/** 'pass' after enough taps on the target, 'fail' on any other color. */
export function checkTap(state: CheckState, color: CheckColor): 'pass' | 'more' | 'fail' {
  if (color !== state.target) return 'fail';
  state.hits++;
  return state.hits >= TAPS_NEEDED ? 'pass' : 'more';
}
