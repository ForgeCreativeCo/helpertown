import { describe, expect, it } from 'vitest';
import { expandLines, getLine, LINE_TEMPLATES, missingPlain } from '../src/content/lines';
import { MAGNETS } from '../src/content/magnets';
import { awardMagnet, ingredientPool, maybeIntroduceIngredient, recordIngredientAnswer } from '../src/core/progress';
import { defaultSave, migrate } from '../src/core/storage';
import { voiceJobs } from '../scripts/voices/jobs';

const fresh = () => defaultSave().progress;

describe('Mama’s Kitchen progress', () => {
  it('starts with eggs, banana and milk', () => {
    expect(ingredientPool(fresh())).toEqual(['egg', 'banana', 'milk']);
  });

  it('adds the next ingredient once he knows every current one', () => {
    const p = fresh();
    for (const id of ['egg', 'banana', 'milk'] as const) {
      recordIngredientAnswer(p, id, true);
      recordIngredientAnswer(p, id, true);
    }
    expect(maybeIntroduceIngredient(p)).toBe('strawberry');
    expect(ingredientPool(p)).toHaveLength(4);
  });

  it('keeps ingredients separate from tools', () => {
    const p = fresh();
    recordIngredientAnswer(p, 'egg', true);
    expect(p.tools).toEqual({});
    expect(p.ingredients.egg?.asked).toBe(1);
  });

  it('awards fridge magnets in order', () => {
    const p = fresh();
    expect(awardMagnet(p)).toBe(MAGNETS[0]!.id);
    expect(awardMagnet(p)).toBe(MAGNETS[1]!.id);
  });

  it('older saves get empty kitchen progress', () => {
    const out = migrate({ version: 2, progress: { stickers: ['star'] } });
    expect(out.progress.magnets).toEqual([]);
    expect(out.progress.ingredientsIntroduced).toBe(3);
    expect(out.progress.stickers).toEqual(['star']);
  });
});

describe('Mama’s lines', () => {
  it('are spoken by Mama and say "Mama", not a placeholder', () => {
    const ask = getLine('cook.ask.egg')!;
    expect(ask.speaker).toBe('mama');
    expect(ask.text).toBe('Mama needs the eggs!');
  });

  it('Pops’ lines are still Pops’', () => {
    expect(getLine('fetch.ask.hammer')!.speaker).toBe('pops');
  });

  it('every named Mama line has a name-free version', () => {
    expect(LINE_TEMPLATES.filter((t) => t.speaker === 'mama').filter(missingPlain)).toEqual([]);
  });

  it('voice jobs carry each line’s speaker', () => {
    const jobs = voiceJobs(expandLines(), 'Lincoln', ['Pops']);
    expect(jobs.find((j) => j.id === 'mama.great__c-lincoln')?.speaker).toBe('mama');
    expect(jobs.find((j) => j.id === 'mama.great__c-lincoln')?.text).toBe("You're a great helper, Lincoln!");
    expect(jobs.find((j) => j.id === 'round.great__c-lincoln')?.speaker).toBe('pops');
  });
});
