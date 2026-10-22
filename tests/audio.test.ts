import { describe, expect, it } from 'vitest';
import { voiceSources, type VoiceSource } from '../src/core/audio/sources';
import { VoiceQueue, type VoiceDeps } from '../src/core/audio/voiceQueue';

describe('voiceSources (playback priority)', () => {
  const avail = {
    parent: new Set(['a', 'a__c-sam']),
    recorded: { a: 'a.mp3', 'a__c-sam': 'a__c-sam.mp3' },
    generated: { a: 'a.mp3', 'a__c-sam': 'a__c-sam.ogg' },
  };

  it('orders parent > bundled recording > generated, named before plain within each', () => {
    const order = voiceSources(['a__c-sam', 'a'], avail).map((s) => `${s.kind}:${s.id}`);
    expect(order).toEqual([
      'parent:a__c-sam',
      'parent:a',
      'recorded:a__c-sam',
      'recorded:a',
      'generated:a__c-sam',
      'generated:a',
    ]);
  });

  it('builds bundled URLs from the base path and real file names', () => {
    const [src] = voiceSources(['a__c-sam'], { parent: new Set(), recorded: {}, generated: avail.generated }, '/app/');
    expect(src).toEqual({ kind: 'generated', id: 'a__c-sam', url: '/app/audio/generated/a__c-sam.ogg' });
  });

  it('returns nothing when no file exists', () => {
    expect(voiceSources(['zzz'], avail)).toEqual([]);
  });
});

type Buf = { src: VoiceSource };

function makeDeps(over: Partial<VoiceDeps<Buf>> = {}) {
  const log: string[] = [];
  const deps: VoiceDeps<Buf> = {
    resolve: (id) => ({
      sources: [
        { kind: 'parent', id },
        { kind: 'generated', id, url: `/${id}.mp3` },
      ],
      text: `text ${id}`,
    }),
    load: async (src) => ({ src }),
    play: async (buf) => {
      log.push(`play ${buf.src.kind}:${buf.src.id}`);
      return true;
    },
    speak: async (text) => {
      log.push(`speak ${text}`);
      return true;
    },
    wait: async () => {
      log.push('wait');
    },
    silentMs: 10,
    ...over,
  };
  return { deps, log };
}

describe('VoiceQueue fallback chain', () => {
  it('plays the first source that loads', async () => {
    const { deps, log } = makeDeps();
    const r = await new VoiceQueue(deps).speak('x');
    expect(r.outcome).toBe('file');
    expect(r.source?.kind).toBe('parent');
    expect(log).toEqual(['play parent:x']);
  });

  it('skips sources that fail to load', async () => {
    const { deps, log } = makeDeps({
      load: async (src) => {
        if (src.kind === 'parent') throw new Error('gone');
        return { src };
      },
    });
    const r = await new VoiceQueue(deps).speak('x');
    expect(r.source?.kind).toBe('generated');
    expect(log).toEqual(['play generated:x']);
  });

  it('falls back to runtime speech when no file plays', async () => {
    const { deps, log } = makeDeps({ resolve: (id) => ({ sources: [], text: `say ${id}` }) });
    const r = await new VoiceQueue(deps).speak('x');
    expect(r.outcome).toBe('speech');
    expect(log).toEqual(['speak say x']);
  });

  it('goes straight to speech when audio output is not running', async () => {
    const { deps, log } = makeDeps({ play: async () => false });
    const r = await new VoiceQueue(deps).speak('x');
    expect(r.outcome).toBe('speech');
    expect(log).toEqual(['speak text x']);
  });

  it('resolves silent (never hangs) when nothing can play', async () => {
    const { deps, log } = makeDeps({ play: async () => false, speak: async () => false });
    const r = await new VoiceQueue(deps).speak('x');
    expect(r.outcome).toBe('silent');
    expect(log).toEqual(['wait']);
  });

  it('resolves silent for unknown lines', async () => {
    const { deps } = makeDeps({ resolve: () => null });
    expect((await new VoiceQueue(deps).speak('nope')).outcome).toBe('silent');
  });

  it('survives a throwing player', async () => {
    const { deps } = makeDeps({
      play: async () => {
        throw new Error('boom');
      },
    });
    const q = new VoiceQueue(deps);
    expect((await q.speak('x')).outcome).toBe('silent');
    expect(q.busy).toBe(false);
  });
});

describe('VoiceQueue ordering', () => {
  it('plays lines one at a time, in order', async () => {
    const { deps, log } = makeDeps();
    const q = new VoiceQueue(deps);
    await Promise.all([q.speak('a'), q.speak('b'), q.speak('c')]);
    expect(log).toEqual(['play parent:a', 'play parent:b', 'play parent:c']);
  });

  it('does not queue a line that is already waiting', async () => {
    const { deps, log } = makeDeps();
    const q = new VoiceQueue(deps);
    const a = q.speak('a');
    const b1 = q.speak('b');
    const b2 = q.speak('b');
    expect(b1).toBe(b2);
    await Promise.all([a, b1]);
    expect(log).toEqual(['play parent:a', 'play parent:b']);
  });

  it('replaceQueued drops waiting lines but lets the current one finish', async () => {
    const { deps, log } = makeDeps();
    const q = new VoiceQueue(deps);
    const a = q.speak('a');
    const b = q.speak('b');
    const c = q.speak('c', { replaceQueued: true });
    expect((await b).outcome).toBe('dropped');
    await Promise.all([a, c]);
    expect(log).toEqual(['play parent:a', 'play parent:c']);
  });

  it('idle() waits for everything queued', async () => {
    const { deps, log } = makeDeps();
    const q = new VoiceQueue(deps);
    void q.speak('a');
    void q.speak('b');
    await q.idle();
    expect(log).toHaveLength(2);
    expect(q.busy).toBe(false);
  });
});
