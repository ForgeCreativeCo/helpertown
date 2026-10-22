import manifest from 'virtual:asset-manifest';
import { blobs } from './db';

/**
 * Family photos: one of the real Pops (framed on the workshop wall and in
 * celebrations) and one of the child (in a hard-hat frame in his garage).
 * A photo added in the parent menu (IndexedDB) wins over a bundled file in
 * public/family/.
 */
export type PhotoId = 'pops' | 'child';

const cache = new Map<PhotoId, Promise<string | null>>();
const objectUrls = new Map<PhotoId, string>();

export function photoUrl(id: PhotoId): Promise<string | null> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      try {
        const blob = await blobs.get('photos', id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          objectUrls.set(id, url);
          return url;
        }
      } catch {
        // No IndexedDB: fall through to the bundled photo.
      }
      const file = manifest.family[id];
      return file ? `${import.meta.env.BASE_URL}family/${file}` : null;
    })();
    cache.set(id, p);
  }
  return p;
}

/** Call after adding or removing a photo. */
export function forgetPhoto(id: PhotoId): void {
  cache.delete(id);
  const url = objectUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  objectUrls.delete(id);
}

/** Shrinks a chosen picture to a small JPEG so it loads fast on the tablet. */
export async function preparePhoto(file: Blob, max = 640): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that picture'))), 'image/jpeg', 0.85),
  );
}
