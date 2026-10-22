/** Letters and numbers for the Post Office. */

export const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;
export type Letter = (typeof ALPHABET)[number];

function isLetter(c: string): c is Letter {
  return (ALPHABET as readonly string[]).includes(c);
}

/** The letters of his name, in order, repeats included ("LINCOLN"). */
export function nameLetters(name: string): Letter[] {
  return [...name.toUpperCase()].filter(isLetter);
}

/**
 * The order letters are introduced: the letters of his name first (they
 * matter most to him), then the rest of the alphabet.
 */
export function letterOrder(name: string): Letter[] {
  const first = [...new Set(nameLetters(name))];
  return [...first, ...ALPHABET.filter((l) => !first.includes(l))];
}

export const STARTER_LETTERS = 3;

export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type HouseNumber = (typeof NUMBERS)[number];
export const NUMBER_NAMES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const;
export const STARTER_NUMBERS = 3;

/** Bright, distinct colors for letter and number tiles. */
const TILE_COLORS = ['#e4473b', '#3d7fe0', '#f2b33d', '#3fae5a', '#8b5cd6', '#f07f2a', '#e85fa4'];
export function tileColor(i: number): string {
  return TILE_COLORS[i % TILE_COLORS.length]!;
}
