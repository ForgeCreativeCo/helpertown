export type MagnetId = 'strawberry' | 'cupcake' | 'banana' | 'carrot' | 'heart' | 'star' | 'flower' | 'apple';

export interface Magnet {
  id: MagnetId;
  /** Spoken as its own sentence, e.g. "A cupcake!". */
  phrase: string;
}

/** Kitchen rewards: fridge magnets, awarded in this order, then round again. */
export const MAGNETS: readonly Magnet[] = [
  { id: 'strawberry', phrase: 'A strawberry' },
  { id: 'cupcake', phrase: 'A cupcake' },
  { id: 'heart', phrase: 'A heart' },
  { id: 'banana', phrase: 'A banana' },
  { id: 'star', phrase: 'A star' },
  { id: 'carrot', phrase: 'A carrot' },
  { id: 'flower', phrase: 'A flower' },
  { id: 'apple', phrase: 'An apple' },
];
