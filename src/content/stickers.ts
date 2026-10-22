export type StickerId =
  | 'star'
  | 'rex'
  | 'longNeck'
  | 'hornDino'
  | 'dumpTruck'
  | 'fireTruck'
  | 'digger'
  | 'hammer'
  | 'wrench'
  | 'bigStar';

export interface Sticker {
  id: StickerId;
  /** Spoken as its own sentence, e.g. "A fire truck!". */
  phrase: string;
}

/** Awarded in this order, then round again. */
export const STICKERS: readonly Sticker[] = [
  { id: 'star', phrase: 'A star' },
  { id: 'rex', phrase: 'A dinosaur' },
  { id: 'dumpTruck', phrase: 'A dump truck' },
  { id: 'hammer', phrase: 'A hammer' },
  { id: 'longNeck', phrase: 'A long-neck dinosaur' },
  { id: 'fireTruck', phrase: 'A fire truck' },
  { id: 'wrench', phrase: 'A wrench' },
  { id: 'hornDino', phrase: 'A dinosaur with horns' },
  { id: 'digger', phrase: 'A digger' },
  { id: 'bigStar', phrase: 'A big shiny star' },
];
