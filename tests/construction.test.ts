import { describe, expect, it } from 'vitest';
import { ROCK_COLORS } from '../src/content/construction';
import { getLine } from '../src/content/lines';

describe('Construction Site', () => {
  it('asks for each rock color in one sentence', () => {
    expect(getLine('build.sort.red')!.text).toBe('Put the red rock in the red truck!');
    for (const r of ROCK_COLORS) expect(getLine(`build.thatsTruck.${r.id}`)).toBeDefined();
  });

  it('reuses the truck names, counting and "A dinosaur!"', () => {
    expect(getLine('garage.name.dumpTruck')).toBeDefined();
    expect(getLine('garage.name.excavator')).toBeDefined();
    expect(getLine('fixit.count.5')).toBeDefined();
    expect(getLine('sticker.say.rex')).toBeDefined();
  });
});
