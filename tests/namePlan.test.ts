import { describe, expect, it } from 'vitest';
import { newTrack, recordAnswer } from '../src/core/difficulty';
import { gapRange, pickGaps } from '../src/core/namePlan';
import { getTrack, setTrack } from '../src/core/progress';
import { defaultSave } from '../src/core/storage';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('Name Sign gaps', () => {
  it('asks for 3 to 5 letters of LINCOLN', () => {
    expect(gapRange(7)).toEqual({ min: 3, max: 5 });
  });

  it('short names ask for every letter', () => {
    expect(gapRange(2)).toEqual({ min: 2, max: 2 });
  });

  it('always includes the first letter, in order, no repeats', () => {
    for (let seed = 1; seed < 100; seed++) {
      const gaps = pickGaps(7, 4, seeded(seed));
      expect(gaps).toHaveLength(4);
      expect(gaps[0]).toBe(0);
      expect([...gaps].sort((a, b) => a - b)).toEqual(gaps);
      expect(new Set(gaps).size).toBe(4);
      for (const g of gaps) expect(g).toBeLessThan(7);
    }
  });

  it('over a few rounds, every letter of his name comes up', () => {
    const seen = new Set<number>();
    const rng = seeded(42);
    for (let round = 0; round < 20; round++) for (const g of pickGaps(7, 3, rng)) seen.add(g);
    expect(seen.size).toBe(7);
  });

  it('one round with no mistakes adds a gap', () => {
    let t = newTrack(3, 5);
    for (let i = 0; i < 3; i++) t = recordAnswer(t, true);
    expect(t.value).toBe(4);
  });

  it('a tablet that saved the old one-letter level starts at 3', () => {
    const p = defaultSave().progress;
    setTrack(p, 'name.missing', newTrack(1, 7, 1));
    expect(getTrack(p, 'name.missing', 3, 5).value).toBe(3);
  });
});
