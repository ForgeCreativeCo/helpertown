import { describe, expect, it } from 'vitest';
import { atTop, choiceCount, newTrack, recordAnswer, sanitizeTrack, startRound, type Track } from '../src/core/difficulty';

function answers(t: Track, results: boolean[]): Track {
  return results.reduce((acc, r) => recordAnswer(acc, r), t);
}

describe('difficulty track', () => {
  it('starts at the minimum (2 choices)', () => {
    expect(newTrack(2, 4).value).toBe(2);
  });

  it('adds a choice after 3 first-try correct in a row', () => {
    const t = answers(newTrack(2, 4), [true, true]);
    expect(t.value).toBe(2);
    expect(recordAnswer(t, true).value).toBe(3);
  });

  it('a miss breaks the streak', () => {
    expect(answers(newTrack(2, 4), [true, true, false, true]).value).toBe(2);
  });

  it('never goes above the max', () => {
    const t = answers(newTrack(2, 4), Array(20).fill(true));
    expect(t.value).toBe(4);
    expect(atTop(t)).toBe(true);
  });

  it('removes a choice after 2 misses in a round', () => {
    const t = newTrack(2, 4, 4);
    expect(recordAnswer(t, false).value).toBe(4);
    expect(answers(t, [false, false]).value).toBe(3);
  });

  it('misses only count within one round', () => {
    let t = recordAnswer(newTrack(2, 4, 3), false);
    t = startRound(t);
    expect(recordAnswer(t, false).value).toBe(3);
  });

  it('never goes below the min', () => {
    expect(answers(newTrack(2, 4), [false, false, false, false]).value).toBe(2);
  });

  it('works for the Fix It taps track (2..5)', () => {
    const t = answers(newTrack(2, 5), Array(12).fill(true));
    expect(t.value).toBe(5);
  });

  it('a parent-fixed level wins', () => {
    expect(choiceCount(newTrack(2, 4, 4), 2)).toBe(2);
    expect(choiceCount(newTrack(2, 4, 3), 'auto')).toBe(3);
  });

  it('sanitizes stored tracks', () => {
    expect(sanitizeTrack({ value: 9 }, 2, 4).value).toBe(4);
    expect(sanitizeTrack(undefined, 2, 4)).toEqual(newTrack(2, 4));
  });
});
