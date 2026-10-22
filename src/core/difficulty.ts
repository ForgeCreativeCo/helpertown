/**
 * Adaptive difficulty, as pure functions. A track is one adjustable number
 * (choices on screen, or taps to finish a fix) that moves with first-try
 * accuracy:
 *   - 3 first-try correct answers in a row: up one (to the max)
 *   - 2 first-try misses in one round: down one (to the min)
 */
export interface Track {
  value: number;
  min: number;
  max: number;
  /** First-try correct answers in a row. */
  streak: number;
  /** First-try misses in the current round. */
  roundMisses: number;
}

export const UP_AFTER_STREAK = 3;
export const DOWN_AFTER_MISSES = 2;

export function newTrack(min: number, max: number, value = min): Track {
  return { value, min, max, streak: 0, roundMisses: 0 };
}

export function startRound(t: Track): Track {
  return { ...t, roundMisses: 0 };
}

/** Records one question's outcome: was it right on the first tap? */
export function recordAnswer(t: Track, firstTry: boolean): Track {
  if (firstTry) {
    const streak = t.streak + 1;
    if (streak >= UP_AFTER_STREAK && t.value < t.max) return { ...t, value: t.value + 1, streak: 0 };
    return { ...t, streak };
  }
  const roundMisses = t.roundMisses + 1;
  if (roundMisses >= DOWN_AFTER_MISSES && t.value > t.min) {
    return { ...t, value: t.value - 1, streak: 0, roundMisses: 0 };
  }
  return { ...t, streak: 0, roundMisses };
}

/** True at the top of the track (unlocks Fix It's "problem only" mode). */
export function atTop(t: Track): boolean {
  return t.value >= t.max;
}

/** Keeps a stored track valid if its limits change between versions. */
export function sanitizeTrack(t: Partial<Track> | undefined, min: number, max: number): Track {
  const value = typeof t?.value === 'number' ? Math.min(max, Math.max(min, Math.round(t.value))) : min;
  return {
    value,
    min,
    max,
    streak: typeof t?.streak === 'number' ? t.streak : 0,
    roundMisses: typeof t?.roundMisses === 'number' ? t.roundMisses : 0,
  };
}

/** Choices to show: a parent's fixed level wins over the adaptive one. */
export function choiceCount(t: Track, setting: 'auto' | 2 | 3 | 4): number {
  return setting === 'auto' ? t.value : setting;
}
