import { describe, expect, it } from 'vitest';
import { defaultSave, localDate, migrate, SAVE_VERSION, Store, STORAGE_KEY } from '../src/core/storage';

function memoryKV(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(STORAGE_KEY, initial);
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    map,
  };
}

describe('migrate', () => {
  it('turns background music on once for version 2 saves', () => {
    expect(migrate({ version: 2, settings: { childName: 'Sam', music: false } }).settings.music).toBe(true);
    expect(migrate({ version: SAVE_VERSION, settings: { childName: 'Sam', music: false } }).settings.music).toBe(false);
  });

  it('returns defaults for missing or broken data', () => {
    expect(migrate(null)).toEqual(defaultSave());
    expect(migrate('nope')).toEqual(defaultSave());
    expect(migrate([1, 2])).toEqual(defaultSave());
  });

  it('keeps valid fields and drops ones with the wrong type', () => {
    const out = migrate({
      version: SAVE_VERSION,
      settings: { childName: 'Sam', sessionMinutes: 'lots', music: true },
    });
    expect(out.settings.childName).toBe('Sam');
    expect(out.settings.music).toBe(true);
    expect(out.settings.sessionMinutes).toBe(defaultSave().settings.sessionMinutes);
  });

  it('runs migrations in order from the stored version', () => {
    const seen: number[] = [];
    const migrations = {
      0: (d: Record<string, unknown>) => (seen.push(0), { ...d, settings: { childName: 'From0' } }),
      1: (d: Record<string, unknown>) => (seen.push(1), d),
    };
    const out = migrate({ version: 0 }, migrations, 2);
    expect(seen).toEqual([0, 1]);
    expect(out.version).toBe(2);
    expect(out.settings.childName).toBe('From0');
  });

  it('falls back to defaults for data from a newer version', () => {
    expect(migrate({ version: SAVE_VERSION + 1, settings: { childName: 'X' } })).toEqual(defaultSave());
  });
});

describe('Store', () => {
  it('survives corrupt JSON', () => {
    const s = new Store(memoryKV('{not json'));
    expect(s.data).toEqual(defaultSave());
  });

  it('saves and reloads', () => {
    const kv = memoryKV();
    const s = new Store(kv);
    s.update((d) => (d.settings.childName = 'Sam'));
    expect(new Store(kv).settings.childName).toBe('Sam');
  });

  it('reset keeps settings but clears progress', () => {
    const s = new Store(memoryKV());
    s.update((d) => {
      d.settings.childName = 'Sam';
      d.progress.playMs['2026-01-01'] = 5000;
    });
    s.reset();
    expect(s.settings.childName).toBe('Sam');
    expect(s.progress.playMs).toEqual({});
  });

  it('keeps working when storage throws', () => {
    const s = new Store({
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    });
    expect(() => s.update((d) => (d.settings.music = true))).not.toThrow();
    expect(s.settings.music).toBe(true);
  });
});

describe('localDate', () => {
  it('formats the local calendar date', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
