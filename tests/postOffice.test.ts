import { describe, expect, it } from 'vitest';
import { ALPHABET, letterOrder, nameLetters } from '../src/content/letters';
import { getLine } from '../src/content/lines';
import { awardStamp, letterPool, maybeIntroduceLetter, maybeIntroduceNumber, numberPool, recordLetterAnswer, recordNumberAnswer } from '../src/core/progress';
import { defaultSave, migrate } from '../src/core/storage';

const fresh = () => defaultSave().progress;

describe('letters', () => {
  it('reads the letters of his name, repeats included', () => {
    expect(nameLetters('Lincoln')).toEqual(['L', 'I', 'N', 'C', 'O', 'L', 'N']);
    expect(nameLetters("Jo-Ann 2")).toEqual(['J', 'O', 'A', 'N', 'N']);
  });

  it('introduces his name letters first, then the rest of the alphabet', () => {
    const order = letterOrder('Lincoln');
    expect(order.slice(0, 5)).toEqual(['L', 'I', 'N', 'C', 'O']);
    expect(order).toHaveLength(26);
    expect(new Set(order).size).toBe(26);
  });

  it('works with no name (plain A to Z)', () => {
    expect(letterOrder('')).toEqual([...ALPHABET]);
  });

  it('starts with L, I and N for Lincoln and adds C once he knows them', () => {
    const p = fresh();
    expect(letterPool(p, 'Lincoln')).toEqual(['L', 'I', 'N']);
    for (const l of ['L', 'I', 'N'] as const) {
      recordLetterAnswer(p, l, true);
      recordLetterAnswer(p, l, true);
    }
    expect(maybeIntroduceLetter(p, 'Lincoln')).toBe('C');
  });
});

describe('house numbers', () => {
  it('starts with houses 1 to 3 and adds 4 next', () => {
    const p = fresh();
    expect(numberPool(p)).toEqual(['1', '2', '3']);
    for (const n of ['1', '2', '3']) {
      recordNumberAnswer(p, n, true);
      recordNumberAnswer(p, n, true);
    }
    expect(maybeIntroduceNumber(p)).toBe('4');
  });

  it('goes up to ten', () => {
    const p = fresh();
    p.numbersIntroduced = 99;
    expect(numberPool(p)).toHaveLength(10);
  });
});

describe('post office progress and lines', () => {
  it('awards stamps', () => {
    const p = fresh();
    awardStamp(p);
    awardStamp(p);
    expect(p.stamps).toHaveLength(2);
    expect(p.stamps[0]).not.toBe(p.stamps[1]);
  });

  it('older saves start with empty post office progress', () => {
    const out = migrate({ version: 2, progress: {} }).progress;
    expect(out.stamps).toEqual([]);
    expect(out.lettersIntroduced).toBe(3);
  });

  it('has whole-sentence letter and number lines in Pops’ voice', () => {
    expect(getLine('letter.find.L')!.text).toBe('Find the letter L!');
    expect(getLine('num.ask.3')!.text).toBe('This package goes to house three!');
    expect(getLine('num.ask.10')!.speaker).toBe('pops');
  });
});
