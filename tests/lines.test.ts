import { describe, expect, it } from 'vitest';
import {
  expandLines,
  getLine,
  LINE_TEMPLATES,
  missingPlain,
  namedVariantId,
  spokenText,
  voiceCandidates,
  type LineTemplate,
} from '../src/content/lines';

describe('voice lines', () => {
  it('every template that uses a name has a name-free version', () => {
    expect(LINE_TEMPLATES.filter(missingPlain).map((t) => t.id)).toEqual([]);
  });

  it('line ids are unique', () => {
    const ids = expandLines().map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every variable in the text is declared or a name', () => {
    for (const t of LINE_TEMPLATES) {
      const used = [...t.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const v of used) expect(['child', 'grandpa', ...(t.vars ?? [])]).toContain(v);
    }
  });

  it('expands one whole sentence per combination', () => {
    const templates: LineTemplate[] = [{ id: 'x.ask', group: 'fetch', text: '{grandpa} needs the {tool}!', plain: 'We need the {tool}!', vars: ['tool'] }];
    const lines = expandLines(templates);
    expect(lines).toHaveLength(7);
    const pump = lines.find((l) => l.id === 'x.ask.pump')!;
    expect(pump.text).toBe('{grandpa} needs the air pump!');
    expect(pump.plain).toBe('We need the air pump!');
  });
});

describe('named variants', () => {
  const hello = getLine('start.hello')!;
  const giggle = getLine('pops.giggle')!;

  it('builds a named id from the names a line uses', () => {
    expect(namedVariantId(hello, { child: 'Sam Jr.', grandpa: 'Pops' })).toBe('start.hello__c-sam-jr__g-pops');
    expect(namedVariantId(giggle, { child: 'Sam', grandpa: 'Pops' })).toBeNull();
  });

  it('tries the named file first, then the name-free one', () => {
    expect(voiceCandidates(hello, { child: 'Sam', grandpa: 'Pappa' })).toEqual([
      'start.hello__c-sam__g-pappa',
      'start.hello',
    ]);
  });

  it('uses only the name-free version when a needed name is empty', () => {
    expect(voiceCandidates(hello, { child: '', grandpa: 'Pops' })).toEqual(['start.hello']);
    expect(spokenText(hello, { child: '', grandpa: 'Pops' })).toBe(hello.plain);
  });

  it('fills names for runtime speech', () => {
    expect(spokenText(hello, { child: 'Sam', grandpa: 'Pops' })).toBe("Hi Sam! Let's help Pops!");
  });
});
