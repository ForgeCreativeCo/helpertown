import { PROBLEMS } from './problems';
import { STICKERS } from './stickers';
import { TOOLS } from './tools';
import { VEHICLES } from './vehicles';

/**
 * Every spoken line in the game. Each template expands into one concrete line
 * per combination of its variables (e.g. `fetch.ask.hammer`), and every
 * concrete line is a whole sentence: no stitching fragments together.
 *
 * `{child}` and `{grandpa}` are names. A template that uses either must also
 * have `plain`, a name-free version that plays whenever no matching named
 * voice file exists.
 */
export type LineGroup = 'start' | 'hub' | 'pops' | 'fetch' | 'fixit' | 'praise' | 'round' | 'sticker' | 'idle';

export type VarKind = 'tool' | 'sticker' | 'vehicle' | 'problem' | 'count';

export interface LineTemplate {
  id: string;
  group: LineGroup;
  text: string;
  plain?: string;
  vars?: readonly VarKind[];
}

export const LINE_TEMPLATES: readonly LineTemplate[] = [
  { id: 'start.hello', group: 'start', text: "Hi {child}! Let's help {grandpa}!", plain: "Hi there! Let's go help!" },

  { id: 'hub.toolbox', group: 'hub', text: 'The toolbox!' },
  { id: 'hub.lift', group: 'hub', text: 'The car lift!' },
  { id: 'hub.pegboard', group: 'hub', text: 'The tool wall!' },
  { id: 'hub.garage', group: 'hub', text: 'Your garage!' },

  { id: 'pops.hello', group: 'pops', text: 'Hi {child}!', plain: 'Hi, buddy!' },
  { id: 'pops.giggle', group: 'pops', text: 'Hee hee! That tickles!' },

  { id: 'fetch.intro', group: 'fetch', text: "Let's help {grandpa} find tools!", plain: "Let's find some tools!" },
  { id: 'fetch.ask', group: 'fetch', text: '{grandpa} needs the {tool}!', plain: 'We need the {tool}!', vars: ['tool'] },
  { id: 'fetch.thatsThe', group: 'fetch', text: "That's the {tool}!", vars: ['tool'] },
  { id: 'fetch.found', group: 'fetch', text: 'You found the {tool}!', vars: ['tool'] },
  { id: 'fetch.newTool', group: 'fetch', text: 'Look! A new tool! The {tool}!', vars: ['tool'] },

  // Short extra praise, rotated so it doesn't get repetitive.
  { id: 'praise.thanks', group: 'praise', text: 'Thanks, buddy!' },
  { id: 'praise.justRight', group: 'praise', text: 'Just what I needed!' },
  { id: 'praise.quick', group: 'praise', text: "Wow, you're quick!" },
  { id: 'praise.greatHelping', group: 'praise', text: 'Great helping!' },

  { id: 'round.great', group: 'round', text: "You're a great helper, {child}!", plain: "You're a great helper!" },
  { id: 'round.sticker', group: 'round', text: 'A new sticker for your toolbox!' },
  { id: 'sticker.say', group: 'sticker', text: '{sticker}!', vars: ['sticker'] },

  { id: 'idle.stillThere', group: 'idle', text: 'Are you still there?' },

  // Fix It. The tool request reuses fetch.ask ("Pops needs the pump!").
  { id: 'fixit.intro', group: 'fixit', text: 'Time to fix things with {grandpa}!', plain: 'Time to fix things!' },
  { id: 'fixit.problem', group: 'fixit', text: 'Uh oh! {problem}', vars: ['problem'] },
  // Top difficulty: Pops names only the problem and he picks the tool himself.
  { id: 'fixit.which', group: 'fixit', text: '{problem} Which tool do we need?', vars: ['problem'] },
  { id: 'fixit.yourTurn', group: 'fixit', text: 'Your turn! Tap to fix it!' },
  { id: 'fixit.keepGoing', group: 'fixit', text: 'Keep tapping!' },
  { id: 'fixit.count', group: 'fixit', text: '{count}!', vars: ['count'] },
  { id: 'fixit.fixed', group: 'fixit', text: 'You fixed the {vehicle}!', vars: ['vehicle'] },
  { id: 'fixit.toGarage', group: 'fixit', text: "It's going to your garage!" },
  { id: 'fixit.star', group: 'fixit', text: 'It gets a shiny star!' },
];

export const PRAISE_LINES = ['praise.thanks', 'praise.justRight', 'praise.quick', 'praise.greatHelping'] as const;

/** Variable values for each kind, with the spoken word used in the text. */
const VAR_VALUES: Record<VarKind, readonly { id: string; word: string }[]> = {
  tool: TOOLS.map((t) => ({ id: t.id, word: t.name })),
  sticker: STICKERS.map((s) => ({ id: s.id, word: s.phrase })),
  vehicle: VEHICLES.map((v) => ({ id: v.id, word: v.name })),
  problem: PROBLEMS.map((p) => ({ id: p.id, word: p.sentence })),
  count: ['One', 'Two', 'Three', 'Four', 'Five'].map((word, i) => ({ id: String(i + 1), word })),
};

export interface Line {
  /** Stable concrete id, e.g. `fetch.ask.hammer`. Also the voice file name. */
  id: string;
  templateId: string;
  group: LineGroup;
  /** Text with variables filled in, names still as `{child}`/`{grandpa}`. */
  text: string;
  /** Name-free text; equals `text` for lines that use no names. */
  plain: string;
  usesChild: boolean;
  usesGrandpa: boolean;
}

export interface Names {
  child: string;
  grandpa: string;
}

const NAME_VARS = /\{(child|grandpa)\}/;

function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);
}

/** The concrete line id for a template and its variable values (in `vars` order). */
export function lineId(templateId: string, ...values: string[]): string {
  return [templateId, ...values].join('.');
}

/** Expands every template into every concrete line. */
export function expandLines(templates: readonly LineTemplate[] = LINE_TEMPLATES): Line[] {
  const out: Line[] = [];
  for (const t of templates) {
    let combos: { ids: string[]; words: Record<string, string> }[] = [{ ids: [], words: {} }];
    for (const kind of t.vars ?? []) {
      combos = combos.flatMap((c) =>
        VAR_VALUES[kind].map((v) => ({ ids: [...c.ids, v.id], words: { ...c.words, [kind]: v.word } })),
      );
    }
    for (const c of combos) {
      const text = fill(t.text, c.words);
      out.push({
        id: lineId(t.id, ...c.ids),
        templateId: t.id,
        group: t.group,
        text,
        plain: fill(t.plain ?? t.text, c.words),
        usesChild: t.text.includes('{child}'),
        usesGrandpa: t.text.includes('{grandpa}'),
      });
    }
  }
  return out;
}

let lineIndex: Map<string, Line> | null = null;

export function getLine(id: string): Line | undefined {
  lineIndex ??= new Map(expandLines().map((l) => [l.id, l]));
  return lineIndex.get(id);
}

export function slug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * The file id of a line's named version for these names, e.g.
 * `start.hello__c-sam__g-pops`, or null if the line uses no names or a name it
 * needs is empty.
 */
export function namedVariantId(line: Line, names: Names): string | null {
  if (!line.usesChild && !line.usesGrandpa) return null;
  let id = line.id;
  if (line.usesChild) {
    if (!slug(names.child)) return null;
    id += `__c-${slug(names.child)}`;
  }
  if (line.usesGrandpa) {
    if (!slug(names.grandpa)) return null;
    id += `__g-${slug(names.grandpa)}`;
  }
  return id;
}

/** Voice file ids to try for a line, best first: the named version, then the plain one. */
export function voiceCandidates(line: Line, names: Names): string[] {
  const named = namedVariantId(line, names);
  return named ? [named, line.id] : [line.id];
}

/** The sentence to speak with runtime speech: named if the names are known, else plain. */
export function spokenText(line: Line, names: Names): string {
  if (namedVariantId(line, names) === null && (line.usesChild || line.usesGrandpa)) return line.plain;
  return fill(line.text, { child: names.child, grandpa: names.grandpa });
}

/** True if a template's text uses a name but has no name-free version. Used by tests. */
export function missingPlain(t: LineTemplate): boolean {
  return NAME_VARS.test(t.text) && (!t.plain || NAME_VARS.test(t.plain));
}
