import { describe, expect, it } from 'vitest';
import { checkTap, newCheck } from '../src/parent/check';
import { addPlay, isResting, playedInLast, resetSession, startRest, timeUp } from '../src/core/session';
import { defaultSave, localDate, migrate } from '../src/core/storage';

const fresh = () => defaultSave().progress;
const MIN = 60_000;

describe('session timer', () => {
  it('counts active play toward the session and the day', () => {
    const p = fresh();
    addPlay(p, 5 * MIN, '2026-10-22');
    addPlay(p, 4 * MIN, '2026-10-22');
    expect(p.playMs['2026-10-22']).toBe(9 * MIN);
    expect(p.session.ms).toBe(9 * MIN);
  });

  it('is up once the session length is reached', () => {
    const p = fresh();
    addPlay(p, 14 * MIN, '2026-10-22');
    expect(timeUp(p, 15, '2026-10-22')).toBe(false);
    addPlay(p, MIN, '2026-10-22');
    expect(timeUp(p, 15, '2026-10-22')).toBe(true);
  });

  it('never ends when the limit is off', () => {
    const p = fresh();
    addPlay(p, 300 * MIN, '2026-10-22');
    expect(timeUp(p, 0, '2026-10-22')).toBe(false);
  });

  it('rests for the rest of the day, then starts fresh tomorrow', () => {
    const p = fresh();
    addPlay(p, 20 * MIN, '2026-10-22');
    startRest(p, '2026-10-22');
    expect(isResting(p, '2026-10-22')).toBe(true);
    expect(isResting(p, '2026-10-23')).toBe(false);
    expect(timeUp(p, 15, '2026-10-23')).toBe(false);
  });

  it('a grown-up reset starts the session over', () => {
    const p = fresh();
    addPlay(p, 20 * MIN, '2026-10-22');
    startRest(p, '2026-10-22');
    resetSession(p, '2026-10-22');
    expect(isResting(p, '2026-10-22')).toBe(false);
    expect(timeUp(p, 15, '2026-10-22')).toBe(false);
    // The day's total is kept for the parent's stats.
    expect(p.playMs['2026-10-22']).toBe(20 * MIN);
  });

  it('sums play over the last week', () => {
    const p = fresh();
    p.playMs = { '2026-10-22': 5 * MIN, '2026-10-20': 3 * MIN, '2026-10-10': 99 * MIN };
    expect(playedInLast(p, 7, new Date(2026, 9, 22, 12), localDate)).toBe(8 * MIN);
    expect(playedInLast(p, 1, new Date(2026, 9, 22, 12), localDate)).toBe(5 * MIN);
  });
});

describe('save migration v1 → v2', () => {
  it('fills an empty child name from the family config and adds a session', () => {
    const out = migrate({ version: 1, settings: { childName: '' }, progress: {} });
    expect(out.settings.childName).toBe('Lincoln');
    expect(out.progress.session).toEqual({ date: '', ms: 0, resting: false });
  });

  it('keeps a fixed difficulty and a valid session length', () => {
    const out = migrate({ version: 2, settings: { difficulty: 3, sessionMinutes: 30 } });
    expect(out.settings.difficulty).toBe(3);
    expect(out.settings.sessionMinutes).toBe(30);
  });

  it('drops invalid difficulty and session values', () => {
    const out = migrate({ version: 2, settings: { difficulty: 9, sessionMinutes: 7 } });
    expect(out.settings.difficulty).toBe('auto');
    expect(out.settings.sessionMinutes).toBe(15);
  });
});

describe('grown-ups check', () => {
  it('passes after two taps on the named color', () => {
    const s = newCheck();
    expect(checkTap(s, s.target)).toBe('more');
    expect(checkTap(s, s.target)).toBe('pass');
  });

  it('fails on any other color', () => {
    const s = newCheck();
    const other = s.order.find((c) => c !== s.target)!;
    expect(checkTap(s, s.target)).toBe('more');
    expect(checkTap(s, other)).toBe('fail');
  });

  it('shows all five colors', () => {
    expect(new Set(newCheck().order).size).toBe(5);
  });
});
