import { describe, expect, it } from 'vitest';
import { DECOS, FLAVORS } from '../src/content/bakery';
import { getLine } from '../src/content/lines';
import { addCount, addToBakery, decoChoices, nextFlavor, planCookie } from '../src/core/bakePlan';
import { defaultSave, migrate } from '../src/core/storage';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('baking', () => {
  it('muffin flavors take turns', () => {
    const p = defaultSave().progress;
    expect(nextFlavor(p)).toBe('blueberry');
    addToBakery(p, { kind: 'muffin', flavor: 'blueberry' });
    addToBakery(p, { kind: 'cookie', decos: ['red-heart'] });
    expect(nextFlavor(p)).toBe('banana');
  });

  it('counts 2 to 4 pieces of fruit as the counting track grows', () => {
    expect(addCount(2)).toBe(2);
    expect(addCount(3)).toBe(3);
    expect(addCount(4)).toBe(4);
    expect(addCount(5)).toBe(4);
  });

  it('there are 12 decorations (4 colors × 3 shapes)', () => {
    expect(DECOS).toHaveLength(12);
  });

  it('a cookie gets 3 different decorations', () => {
    for (let seed = 1; seed < 50; seed++) expect(new Set(planCookie(seeded(seed))).size).toBe(3);
  });

  it('decoration choices include the target once, no duplicates', () => {
    for (let seed = 1; seed < 50; seed++) {
      const c = decoChoices('blue-star', 4, seeded(seed));
      expect(c).toHaveLength(4);
      expect(c.filter((d) => d === 'blue-star')).toHaveLength(1);
      expect(new Set(c).size).toBe(4);
    }
  });

  it('older saves start with an empty bakery', () => {
    expect(migrate({ version: 2, progress: {} }).progress.bakery).toEqual([]);
  });
});

describe('baking lines', () => {
  it('count fruit in whole sentences', () => {
    expect(getLine('bake.add.blueberry-3')!.text).toBe('Add three blueberries!');
    expect(getLine('bake.add.banana-2')!.text).toBe('Add two banana slices!');
  });

  it('ask for decorations by color and shape', () => {
    expect(getLine('deco.ask.red-heart')!.text).toBe('Put a red heart on the cookie!');
    expect(getLine('deco.ask.red-heart')!.speaker).toBe('mama');
  });

  it('name every muffin flavor', () => {
    for (const f of FLAVORS) expect(getLine(`bakery.muffin.${f.id}`)!.text).toBe(`A ${f.word} muffin!`);
  });
});
