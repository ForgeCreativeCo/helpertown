import type { SfxName } from '../core/audio/sfx';

export type IngredientId = 'egg' | 'milk' | 'banana' | 'flour' | 'butter' | 'sugar' | 'strawberry' | 'blueberry';

export interface Ingredient {
  id: IngredientId;
  /** Spoken name inside lines ("Mama needs the {ingredient}!"). */
  name: string;
  color: string;
  /** The sound it makes going into the bowl. */
  sfx: SfxName;
}

/** In introduction order: the first three are familiar breakfast things. */
export const INGREDIENTS: readonly Ingredient[] = [
  { id: 'egg', name: 'eggs', color: '#f6efe2', sfx: 'crack' },
  { id: 'banana', name: 'banana', color: '#f5d33d', sfx: 'plop' },
  { id: 'milk', name: 'milk', color: '#7fb4ef', sfx: 'pour' },
  { id: 'strawberry', name: 'strawberries', color: '#e4473b', sfx: 'plop' },
  { id: 'flour', name: 'flour', color: '#e9d8b4', sfx: 'puff' },
  { id: 'butter', name: 'butter', color: '#f7d774', sfx: 'plop' },
  { id: 'blueberry', name: 'blueberries', color: '#4a5fc1', sfx: 'plop' },
  { id: 'sugar', name: 'sugar', color: '#ffffff', sfx: 'sparkle' },
];

export const STARTER_INGREDIENTS = 3;

export function getIngredient(id: IngredientId): Ingredient {
  return INGREDIENTS.find((i) => i.id === id)!;
}
