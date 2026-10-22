import { describe, expect, it } from 'vitest';
import { pickChoices, planTargets, shuffle } from '../src/core/rounds';
import { wrongTapResponse } from '../src/core/errorless';

/** Small deterministic RNG so tests are repeatable. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('planTargets', () => {
  it('never asks for the same thing twice in a row', () => {
    for (let seed = 1; seed < 200; seed++) {
      const plan = planTargets(['a', 'b', 'c'], 4, seeded(seed));
      expect(plan).toHaveLength(4);
      for (let i = 1; i < plan.length; i++) expect(plan[i]).not.toBe(plan[i - 1]);
    }
  });

  it('covers the pool before repeating', () => {
    for (let seed = 1; seed < 50; seed++) {
      const plan = planTargets(['a', 'b', 'c', 'd'], 4, seeded(seed));
      expect(new Set(plan).size).toBe(4);
    }
  });

  it('can start with a new item', () => {
    expect(planTargets(['a', 'b', 'c', 'd'], 4, seeded(3), 'd')[0]).toBe('d');
  });
});

describe('pickChoices', () => {
  it('always includes the target, with no duplicates', () => {
    for (let seed = 1; seed < 100; seed++) {
      const c = pickChoices('b', ['a', 'b', 'c', 'd', 'e'], 3, seeded(seed));
      expect(c).toContain('b');
      expect(new Set(c).size).toBe(3);
    }
  });

  it('is capped by the pool size', () => {
    expect(pickChoices('a', ['a', 'b', 'c'], 4, seeded(1))).toHaveLength(3);
  });
});

describe('shuffle', () => {
  it('keeps every item', () => {
    expect(shuffle([1, 2, 3, 4], seeded(9)).sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('wrongTapResponse', () => {
  it('escalates help: name, then glow, then point and lock', () => {
    expect(wrongTapResponse(1)).toEqual({ glow: false, point: false, onlyCorrect: false });
    expect(wrongTapResponse(2)).toEqual({ glow: true, point: false, onlyCorrect: false });
    expect(wrongTapResponse(3)).toEqual({ glow: true, point: true, onlyCorrect: true });
    expect(wrongTapResponse(7).onlyCorrect).toBe(true);
  });
});
