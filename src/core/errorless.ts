/**
 * The errorless rules, as data. Every question ends with the right answer:
 *   wrong tap 1: the tapped item says its name and wobbles, the question repeats
 *   wrong tap 2: also, the right answer bounces and glows
 *   wrong tap 3+: also, Pops points at it and it's the only thing tappable
 * Idle (no taps): repeat at ~7 s, hint glow at ~14 s, gentle pause at ~60 s.
 */
export interface WrongTapResponse {
  glow: boolean;
  point: boolean;
  onlyCorrect: boolean;
}

export function wrongTapResponse(wrongCount: number): WrongTapResponse {
  return { glow: wrongCount >= 2, point: wrongCount >= 3, onlyCorrect: wrongCount >= 3 };
}

export const IDLE_REPEAT_MS = 7000;
export const IDLE_HINT_MS = 14000;
export const IDLE_PAUSE_MS = 60000;

export type IdleStep = 'repeat' | 'hint' | 'pause';

/** The idle steps in order, with when each fires after the last tap. */
export const IDLE_STEPS: readonly { at: number; step: IdleStep }[] = [
  { at: IDLE_REPEAT_MS, step: 'repeat' },
  { at: IDLE_HINT_MS, step: 'hint' },
  { at: IDLE_PAUSE_MS, step: 'pause' },
];
