import type { StickerId } from './stickers';

/**
 * Dino Dig's three dinosaurs. Each reuses an existing voice line: the sticker
 * line that names it ("A dinosaur!", "A long-neck dinosaur!", "A dinosaur with horns!").
 */
export type DinoId = 'rex' | 'longNeck' | 'hornDino';

export interface Dino {
  id: DinoId;
  color: string;
  /** The sticker line that says its name. */
  nameSticker: StickerId;
}

export const DINOS: readonly Dino[] = [
  { id: 'rex', color: '#6cc46a', nameSticker: 'rex' },
  { id: 'longNeck', color: '#7fb4ef', nameSticker: 'longNeck' },
  { id: 'hornDino', color: '#f5a35c', nameSticker: 'hornDino' },
];

export function getDino(id: DinoId): Dino {
  return DINOS.find((d) => d.id === id)!;
}
