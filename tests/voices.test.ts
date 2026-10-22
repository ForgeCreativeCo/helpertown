import { describe, expect, it } from 'vitest';
import { getLine } from '../src/content/lines';
import { encodeMp3, normalize, readWav, trimSilence } from '../scripts/voices/encode';
import { voiceJobs } from '../scripts/voices/jobs';

describe('voiceJobs', () => {
  const lines = ['start.hello', 'fetch.ask.hammer', 'pops.giggle'].map((id) => getLine(id)!);

  it('makes a name-free file for every line plus named versions', () => {
    const ids = voiceJobs(lines, 'Sam', ['Pops', 'Pappa']).map((j) => j.id);
    expect(ids).toEqual([
      'start.hello',
      'start.hello__c-sam__g-pops',
      'start.hello__c-sam__g-pappa',
      'fetch.ask.hammer',
      'fetch.ask.hammer__g-pops',
      'fetch.ask.hammer__g-pappa',
      'pops.giggle',
    ]);
  });

  it('uses full sentences with names filled in', () => {
    const jobs = voiceJobs(lines, 'Sam', ['Pappa']);
    expect(jobs.find((j) => j.id === 'fetch.ask.hammer__g-pappa')?.text).toBe('Pappa needs the hammer!');
    expect(jobs.find((j) => j.id === 'fetch.ask.hammer')?.text).toBe('We need the hammer!');
  });

  it('skips child-named versions while the child name is empty', () => {
    const ids = voiceJobs(lines, '', ['Pops']).map((j) => j.id);
    expect(ids.some((id) => id.includes('__c-'))).toBe(false);
    expect(ids).toContain('start.hello');
  });
});

function wav(samples: number[], rate = 22050): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(s * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0, 'ascii');
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8, 'ascii');
  h.write('fmt ', 12, 'ascii');
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36, 'ascii');
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

describe('voice encoding', () => {
  it('reads 16-bit WAV', () => {
    const { samples, sampleRate } = readWav(wav([0, 0.5, -0.5]));
    expect(sampleRate).toBe(22050);
    expect(samples[1]).toBeCloseTo(0.5, 3);
  });

  it('trims silence but keeps a short pad', () => {
    const s = new Float32Array(22050);
    s.fill(0.3, 10000, 11000);
    const out = trimSilence(s, 22050, 0.01, 10);
    expect(out.length).toBeGreaterThan(1000);
    expect(out.length).toBeLessThan(1500);
  });

  it('normalizes the peak', () => {
    const out = normalize(new Float32Array([0.1, -0.2]), 0.8);
    expect(Math.max(...out.map(Math.abs))).toBeCloseTo(0.8);
  });

  it('encodes an mp3', () => {
    const tone = new Float32Array(22050).map((_, i) => 0.4 * Math.sin(i / 5));
    const mp3 = encodeMp3(tone, 22050);
    expect(mp3.length).toBeGreaterThan(1000);
    // Starts with an MPEG frame sync (0xFFE) or an ID3 tag.
    expect(mp3[0] === 0xff || mp3.toString('ascii', 0, 3) === 'ID3').toBe(true);
  });
});
