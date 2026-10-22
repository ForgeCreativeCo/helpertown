import { describe, expect, it } from 'vitest';
import {
  awardSticker,
  getTrack,
  knowsTool,
  maybeIntroduceTool,
  nextSticker,
  recordRound,
  recordToolAnswer,
  setTrack,
  toolAccuracy,
  toolPool,
} from '../src/core/progress';
import { newTrack } from '../src/core/difficulty';
import { defaultSave } from '../src/core/storage';
import { STICKERS } from '../src/content/stickers';

const fresh = () => defaultSave().progress;

describe('tool introduction', () => {
  it('starts with hammer, wrench and screwdriver', () => {
    expect(toolPool(fresh())).toEqual(['hammer', 'wrench', 'screwdriver']);
  });

  it('adds the next tool once every current tool is known', () => {
    const p = fresh();
    for (const t of ['hammer', 'wrench'] as const) {
      recordToolAnswer(p, t, true);
      recordToolAnswer(p, t, true);
    }
    expect(maybeIntroduceTool(p)).toBeNull();
    recordToolAnswer(p, 'screwdriver', true);
    recordToolAnswer(p, 'screwdriver', true);
    expect(maybeIntroduceTool(p)).toBe('saw');
    expect(toolPool(p)).toHaveLength(4);
    // The new tool isn't known yet, so nothing else gets added.
    expect(maybeIntroduceTool(p)).toBeNull();
  });

  it('a recent miss means the tool is not known yet', () => {
    const p = fresh();
    recordToolAnswer(p, 'hammer', true);
    recordToolAnswer(p, 'hammer', true);
    recordToolAnswer(p, 'hammer', false);
    expect(knowsTool(p, 'hammer')).toBe(false);
  });

  it('stops at seven tools', () => {
    const p = fresh();
    p.toolsIntroduced = 7;
    expect(maybeIntroduceTool(p)).toBeNull();
    expect(toolPool(p)).toHaveLength(7);
  });

  it('repairs a bad stored count', () => {
    const p = fresh();
    p.toolsIntroduced = -4;
    expect(toolPool(p)).toHaveLength(3);
    p.toolsIntroduced = 99;
    expect(toolPool(p)).toHaveLength(7);
  });
});

describe('stats', () => {
  it('tracks first-try accuracy per tool', () => {
    const p = fresh();
    recordToolAnswer(p, 'wrench', true);
    recordToolAnswer(p, 'wrench', false);
    const wrench = toolAccuracy(p).find((r) => r.tool === 'wrench')!;
    expect(wrench).toEqual({ tool: 'wrench', asked: 2, accuracy: 0.5 });
  });

  it('counts rounds per activity', () => {
    const p = fresh();
    recordRound(p, 'fetch');
    recordRound(p, 'fetch');
    expect(p.rounds.fetch).toBe(2);
  });
});

describe('stickers', () => {
  it('awards stickers in order and wraps around', () => {
    const p = fresh();
    expect(nextSticker(p)).toBe(STICKERS[0]!.id);
    for (let i = 0; i < STICKERS.length; i++) awardSticker(p);
    expect(nextSticker(p)).toBe(STICKERS[0]!.id);
    expect(p.stickers).toHaveLength(STICKERS.length);
  });
});

describe('difficulty tracks in progress', () => {
  it('stores and reads back tracks', () => {
    const p = fresh();
    expect(getTrack(p, 'fetch.choices', 2, 4).value).toBe(2);
    setTrack(p, 'fetch.choices', newTrack(2, 4, 3));
    expect(getTrack(p, 'fetch.choices', 2, 4).value).toBe(3);
  });
});
