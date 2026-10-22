/** Mama's baking: muffin flavors, cookie decorations, and what goes on the bakery shelf. */

export type FlavorId = 'blueberry' | 'banana' | 'strawberry';

export interface Flavor {
  id: FlavorId;
  /** "A {word} muffin!" */
  word: string;
  /** What he adds to the bowl, counted: "Add three {plural}!" */
  plural: string;
  color: string;
}

/** Muffins rotate through these, one flavor per bake. */
export const FLAVORS: readonly Flavor[] = [
  { id: 'blueberry', word: 'blueberry', plural: 'blueberries', color: '#4a5fc1' },
  { id: 'banana', word: 'banana', plural: 'banana slices', color: '#f5d33d' },
  { id: 'strawberry', word: 'strawberry', plural: 'strawberries', color: '#e4473b' },
];

export function getFlavor(id: FlavorId): Flavor {
  return FLAVORS.find((f) => f.id === id)!;
}

/** How many pieces of fruit he counts into the bowl (adjusts with difficulty). */
export const ADD_COUNTS = [2, 3, 4] as const;
export type AddCount = (typeof ADD_COUNTS)[number];

export const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'] as const;

export type DecoColor = 'red' | 'blue' | 'yellow' | 'green';
export type DecoShape = 'heart' | 'star' | 'circle';

export const DECO_COLORS: Record<DecoColor, string> = {
  red: '#e4473b',
  blue: '#3d7fe0',
  yellow: '#f5c518',
  green: '#3fae5a',
};
export const DECO_SHAPES: readonly DecoShape[] = ['heart', 'star', 'circle'];

/** An icing decoration, e.g. 'red-heart'. */
export type DecoId = `${DecoColor}-${DecoShape}`;

export interface Deco {
  id: DecoId;
  color: DecoColor;
  shape: DecoShape;
  /** "Put a {word} on the cookie!" */
  word: string;
}

export const DECOS: readonly Deco[] = (Object.keys(DECO_COLORS) as DecoColor[]).flatMap((color) =>
  DECO_SHAPES.map((shape) => ({ id: `${color}-${shape}` as DecoId, color, shape, word: `${color} ${shape}` })),
);

export function getDeco(id: DecoId): Deco {
  return DECOS.find((d) => d.id === id)!;
}

/** Something he made, kept on the bakery shelf. */
export type BakeItem = { kind: 'muffin'; flavor: FlavorId } | { kind: 'cookie'; decos: DecoId[] };
