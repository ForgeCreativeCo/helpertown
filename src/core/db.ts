/**
 * IndexedDB for things too big for localStorage: parent voice recordings
 * (keyed by voice file id) and family photos ('pops' and 'child').
 */
const DB_NAME = 'helper-town';
const DB_VERSION = 1;

export type BlobStoreName = 'recordings' | 'photos';
const STORES: readonly BlobStoreName[] = ['recordings', 'photos'];

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      for (const name of STORES) {
        if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error('IndexedDB open failed'));
    };
  });
  return dbPromise;
}

function run<T>(store: BlobStoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(store, mode).objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
      }),
  );
}

export const blobs = {
  get(store: BlobStoreName, key: string): Promise<Blob | undefined> {
    return run(store, 'readonly', (s) => s.get(key) as IDBRequest<Blob | undefined>);
  },
  put(store: BlobStoreName, key: string, blob: Blob): Promise<void> {
    return run(store, 'readwrite', (s) => s.put(blob, key)).then(() => undefined);
  },
  delete(store: BlobStoreName, key: string): Promise<void> {
    return run(store, 'readwrite', (s) => s.delete(key)).then(() => undefined);
  },
  keys(store: BlobStoreName): Promise<string[]> {
    return run(store, 'readonly', (s) => s.getAllKeys()).then((keys) => keys.map(String));
  },
  clear(store: BlobStoreName): Promise<void> {
    return run(store, 'readwrite', (s) => s.clear()).then(() => undefined);
  },
};

/** Testing hook: forget the open connection. */
export function _resetDbForTests(): void {
  dbPromise = null;
}
