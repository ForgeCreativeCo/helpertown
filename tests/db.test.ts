import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { blobs } from '../src/core/db';

describe('blob storage', () => {
  it('stores, lists and deletes recordings', async () => {
    await blobs.put('recordings', 'fetch.ask.hammer', new Blob(['abc']));
    expect(await blobs.keys('recordings')).toEqual(['fetch.ask.hammer']);
    const got = await blobs.get('recordings', 'fetch.ask.hammer');
    expect(await got?.text()).toBe('abc');
    await blobs.delete('recordings', 'fetch.ask.hammer');
    expect(await blobs.get('recordings', 'fetch.ask.hammer')).toBeUndefined();
  });

  it('keeps photos separate from recordings', async () => {
    await blobs.put('photos', 'pops', new Blob(['img']));
    expect(await blobs.keys('recordings')).toEqual([]);
    expect(await blobs.keys('photos')).toEqual(['pops']);
    await blobs.clear('photos');
    expect(await blobs.keys('photos')).toEqual([]);
  });
});
