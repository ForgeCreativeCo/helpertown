import { describe, expect, it } from 'vitest';
import { planToolWall, visibleOutlines } from '../src/core/toolWallPlan';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('planToolWall', () => {
  it('hangs 4 different tools, all the ones he knows plus the next one', () => {
    for (let seed = 1; seed < 50; seed++) {
      const tools = planToolWall(['hammer', 'wrench', 'screwdriver'], false, seeded(seed));
      expect(tools).toHaveLength(4);
      expect(new Set(tools).size).toBe(4);
      expect(tools).toEqual(expect.arrayContaining(['hammer', 'wrench', 'screwdriver', 'saw']));
    }
  });

  it('hangs 5 at the top level', () => {
    expect(planToolWall(['hammer', 'wrench', 'screwdriver', 'saw', 'drill', 'pump'], true, seeded(2))).toHaveLength(5);
  });

  it('only uses known tools when he knows enough', () => {
    const pool = ['hammer', 'wrench', 'screwdriver', 'saw', 'drill'] as const;
    for (let seed = 1; seed < 50; seed++) {
      for (const t of planToolWall(pool, false, seeded(seed))) expect(pool).toContain(t);
    }
  });
});

describe('visibleOutlines', () => {
  it('shows the target plus others still empty, up to the choice count', () => {
    for (let seed = 1; seed < 50; seed++) {
      const shown = visibleOutlines('b', ['a', 'b', 'c', 'd'], 3, seeded(seed));
      expect(shown).toHaveLength(3);
      expect(shown).toContain('b');
      expect(new Set(shown).size).toBe(3);
    }
  });

  it('shows fewer when fewer are left', () => {
    expect(visibleOutlines('d', ['d'], 4, seeded(1))).toEqual(['d']);
    expect(visibleOutlines('c', ['c', 'd'], 4, seeded(1))).toHaveLength(2);
  });
});
