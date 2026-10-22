import { family } from '../config/family';
import { ADD_COUNTS, DECOS, FLAVORS, NUMBER_WORDS } from './bakery';
import { INGREDIENTS } from './ingredients';
import { MAGNETS } from './magnets';
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
 * voice file exists. `{mom}` is filled in from family.ts when lines are
 * expanded ("Mama"), so it needs no variants.
 *
 * Each line has a speaker, which picks the voice it's generated in.
 */
export type Speaker = 'pops' | 'mama';

export type LineGroup = 'start' | 'hub' | 'pops' | 'fetch' | 'fixit' | 'toolwall' | 'garage' | 'praise' | 'round' | 'sticker' | 'idle' | 'winddown' | 'town' | 'kitchen' | 'baking';

export type VarKind = 'tool' | 'sticker' | 'vehicle' | 'problem' | 'count' | 'ingredient' | 'magnet' | 'flavor' | 'addition' | 'deco';

export interface LineTemplate {
  id: string;
  group: LineGroup;
  text: string;
  plain?: string;
  vars?: readonly VarKind[];
  /** Who says it (default: Pops). */
  speaker?: Speaker;
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

  // Tool Wall
  { id: 'toolwall.intro', group: 'toolwall', text: "Let's tidy up {grandpa}'s tools!", plain: "Let's tidy up the tools!" },
  { id: 'toolwall.where', group: 'toolwall', text: 'Where does the {tool} go?', vars: ['tool'] },
  { id: 'toolwall.thatsFor', group: 'toolwall', text: 'That spot is for the {tool}!', vars: ['tool'] },
  { id: 'toolwall.allTidy', group: 'toolwall', text: 'All tidy! High five!' },

  // My Garage
  { id: 'garage.welcome', group: 'garage', text: 'Welcome to your garage, {child}!', plain: 'Welcome to your garage!' },
  { id: 'garage.empty', group: 'garage', text: "Your garage is empty! Let's go fix some trucks!" },
  { id: 'garage.name', group: 'garage', text: '{vehicle}!', vars: ['vehicle'] },
  { id: 'nav.home', group: 'hub', text: 'Back to the workshop!' },

  // Town map (Pops narrates)
  { id: 'town.hello', group: 'town', text: 'Hi {child}! Who should we help today?', plain: 'Hi there! Who should we help today?' },
  { id: 'town.workshop', group: 'town', text: "{grandpa}'s workshop!", plain: 'The workshop!' },
  { id: 'town.kitchen', group: 'town', text: "{mom}'s kitchen!" },
  { id: 'nav.town', group: 'town', text: 'Back to town!' },

  // Mama's Kitchen (Mama speaks)
  { id: 'kitchen.hello', group: 'kitchen', speaker: 'mama', text: 'Hi {child}! Want to help me cook?', plain: 'Hi sweetie! Want to help me cook?' },
  { id: 'kitchen.fridge', group: 'kitchen', speaker: 'mama', text: 'The fridge!' },
  { id: 'mama.hello', group: 'kitchen', speaker: 'mama', text: 'Hi, sweetie!' },
  { id: 'mama.giggle', group: 'kitchen', speaker: 'mama', text: "Hee hee! You're so silly!" },
  { id: 'cook.intro', group: 'kitchen', speaker: 'mama', text: "Let's find what we need!" },
  { id: 'cook.ask', group: 'kitchen', speaker: 'mama', text: '{mom} needs the {ingredient}!', vars: ['ingredient'] },
  { id: 'cook.thatsThe', group: 'kitchen', speaker: 'mama', text: "That's the {ingredient}!", vars: ['ingredient'] },
  { id: 'cook.found', group: 'kitchen', speaker: 'mama', text: 'You found the {ingredient}!', vars: ['ingredient'] },
  { id: 'cook.newItem', group: 'kitchen', speaker: 'mama', text: 'Look! Something new! The {ingredient}!', vars: ['ingredient'] },
  { id: 'mamaPraise.thanks', group: 'kitchen', speaker: 'mama', text: 'Thank you, sweetie!' },
  { id: 'mamaPraise.yum', group: 'kitchen', speaker: 'mama', text: 'Yum! Just right!' },
  { id: 'mamaPraise.cook', group: 'kitchen', speaker: 'mama', text: "You're a great cook!" },
  { id: 'mamaPraise.helper', group: 'kitchen', speaker: 'mama', text: 'What a good helper!' },
  { id: 'mama.great', group: 'kitchen', speaker: 'mama', text: "You're a great helper, {child}!", plain: "You're a great helper, sweetie!" },
  { id: 'mama.magnet', group: 'kitchen', speaker: 'mama', text: 'A new magnet for the fridge!' },
  { id: 'magnet.say', group: 'kitchen', speaker: 'mama', text: '{magnet}!', vars: ['magnet'] },
  { id: 'mama.stillThere', group: 'kitchen', speaker: 'mama', text: 'Are you still there, sweetie?' },
  { id: 'mama.count', group: 'kitchen', speaker: 'mama', text: '{count}!', vars: ['count'] },
  { id: 'kitchen.bowl', group: 'kitchen', speaker: 'mama', text: 'The mixing bowl!' },
  { id: 'kitchen.cookies', group: 'kitchen', speaker: 'mama', text: 'The cookies!' },
  { id: 'kitchen.shelf', group: 'kitchen', speaker: 'mama', text: 'The bakery shelf!' },
  { id: 'nav.kitchen', group: 'kitchen', speaker: 'mama', text: 'Back to the kitchen!' },

  // Bake Together
  { id: 'bake.intro', group: 'baking', speaker: 'mama', text: "Let's bake muffins!" },
  { id: 'bake.eggs', group: 'baking', speaker: 'mama', text: 'Crack the eggs! Tap an egg!' },
  { id: 'bake.otherEgg', group: 'baking', speaker: 'mama', text: 'Now the other egg!' },
  { id: 'bake.flour', group: 'baking', speaker: 'mama', text: 'Pour in the flour!' },
  { id: 'bake.milk', group: 'baking', speaker: 'mama', text: 'Now pour the milk!' },
  { id: 'bake.stir', group: 'baking', speaker: 'mama', text: 'Stir it up! Tap the bowl!' },
  { id: 'bake.add', group: 'baking', speaker: 'mama', text: 'Add {addition}!', vars: ['addition'] },
  { id: 'bake.tin', group: 'baking', speaker: 'mama', text: 'Into the muffin tin!' },
  { id: 'bake.oven', group: 'baking', speaker: 'mama', text: 'Tap the oven to turn it on!' },
  { id: 'bake.wait', group: 'baking', speaker: 'mama', text: "Let's wait for them to bake!" },
  { id: 'bake.ding', group: 'baking', speaker: 'mama', text: 'Ding! The muffins are ready!' },
  { id: 'bake.done', group: 'baking', speaker: 'mama', text: 'You made {flavor} muffins!', vars: ['flavor'] },
  { id: 'bake.shelf', group: 'baking', speaker: 'mama', text: 'They go on the bakery shelf!' },

  // Decorate Cookies
  { id: 'deco.intro', group: 'baking', speaker: 'mama', text: "Let's decorate a cookie!" },
  { id: 'deco.ask', group: 'baking', speaker: 'mama', text: 'Put a {deco} on the cookie!', vars: ['deco'] },
  { id: 'deco.thatsA', group: 'baking', speaker: 'mama', text: "That's a {deco}!", vars: ['deco'] },
  { id: 'deco.done', group: 'baking', speaker: 'mama', text: 'What a beautiful cookie!' },
  { id: 'deco.shelf', group: 'baking', speaker: 'mama', text: 'It goes on the bakery shelf!' },

  // Bakery Shelf
  { id: 'bakery.hello', group: 'baking', speaker: 'mama', text: 'Look at everything you made!' },
  { id: 'bakery.empty', group: 'baking', speaker: 'mama', text: "Let's bake something yummy!" },
  { id: 'bakery.muffin', group: 'baking', speaker: 'mama', text: 'A {flavor} muffin!', vars: ['flavor'] },
  { id: 'bakery.cookie', group: 'baking', speaker: 'mama', text: 'A cookie you decorated!' },

  {
    id: 'mama.goodbye',
    group: 'winddown',
    speaker: 'mama',
    text: 'Great work today, {child}! Time for a nap. See you next time!',
    plain: 'Great work today, sweetie! Time for a nap. See you next time!',
  },

  // Session wind-down
  {
    id: 'winddown.goodbye',
    group: 'winddown',
    text: 'Great work today, {child}! {grandpa} needs a nap. See you next time!',
    plain: 'Great work today! Time for a nap. See you next time!',
  },
];

export const PRAISE_LINES = ['praise.thanks', 'praise.justRight', 'praise.quick', 'praise.greatHelping'] as const;
export const MAMA_PRAISE_LINES = ['mamaPraise.thanks', 'mamaPraise.yum', 'mamaPraise.cook', 'mamaPraise.helper'] as const;

/** Variable values for each kind, with the spoken word used in the text. */
const VAR_VALUES: Record<VarKind, readonly { id: string; word: string }[]> = {
  tool: TOOLS.map((t) => ({ id: t.id, word: t.name })),
  sticker: STICKERS.map((s) => ({ id: s.id, word: s.phrase })),
  vehicle: VEHICLES.map((v) => ({ id: v.id, word: v.name })),
  problem: PROBLEMS.map((p) => ({ id: p.id, word: p.sentence })),
  count: ['One', 'Two', 'Three', 'Four', 'Five'].map((word, i) => ({ id: String(i + 1), word })),
  ingredient: INGREDIENTS.map((i) => ({ id: i.id, word: i.name })),
  magnet: MAGNETS.map((m) => ({ id: m.id, word: m.phrase })),
  flavor: FLAVORS.map((f) => ({ id: f.id, word: f.word })),
  addition: FLAVORS.flatMap((f) => ADD_COUNTS.map((n) => ({ id: `${f.id}-${n}`, word: `${NUMBER_WORDS[n]} ${f.plural}` }))),
  deco: DECOS.map((d) => ({ id: d.id, word: d.word })),
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
  speaker: Speaker;
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
      const words = { ...c.words, mom: family.momName };
      const text = fill(t.text, words);
      out.push({
        id: lineId(t.id, ...c.ids),
        templateId: t.id,
        group: t.group,
        text,
        plain: fill(t.plain ?? t.text, words),
        usesChild: t.text.includes('{child}'),
        usesGrandpa: t.text.includes('{grandpa}'),
        speaker: t.speaker ?? 'pops',
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
