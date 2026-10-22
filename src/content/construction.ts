/**
 * Construction Site: rock colors for sorting and the shape tiles for building.
 * Truck names and counting reuse existing lines.
 */
export type RockColor = 'red' | 'blue' | 'yellow' | 'green';

export interface Rock {
  id: RockColor;
  /** Spoken: "Put the red rock in the red truck!" */
  word: string;
  fill: string;
  shade: string;
}

export const ROCK_COLORS: readonly Rock[] = [
  { id: 'red', word: 'red', fill: '#e4473b', shade: '#b8322a' },
  { id: 'blue', word: 'blue', fill: '#3d7fe0', shade: '#2a5fb0' },
  { id: 'yellow', word: 'yellow', fill: '#f5c518', shade: '#c99a0a' },
  { id: 'green', word: 'green', fill: '#3fae5a', shade: '#2b8443' },
];

export function getRock(id: RockColor): Rock {
  return ROCK_COLORS.find((r) => r.id === id)!;
}

export type TileShape = 'square' | 'triangle' | 'rectangle' | 'circle';
export const TILE_SHAPES: readonly TileShape[] = ['square', 'triangle', 'rectangle', 'circle'];
/** The see-through colors of his magnetic tiles. */
export const TILE_COLORS = ['#e4473b', '#3d7fe0', '#f5c518', '#3fae5a', '#8b5cd6', '#f07f2a'];
