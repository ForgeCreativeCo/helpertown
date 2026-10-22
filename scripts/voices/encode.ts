import { Mp3Encoder } from '@breezystack/lamejs';

/** Minimal WAV reader for the 16-bit PCM files TTS engines write. */
export function readWav(buf: Buffer): { samples: Float32Array; sampleRate: number } {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Not a WAV file');
  let pos = 12;
  let channels = 1;
  let sampleRate = 22050;
  let bits = 16;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(body + 2);
      sampleRate = buf.readUInt32LE(body + 4);
      bits = buf.readUInt16LE(body + 14);
    } else if (id === 'data') {
      if (bits !== 16) throw new Error(`Only 16-bit WAV is supported (got ${bits}-bit)`);
      const end = Math.min(buf.length, body + size);
      const frames = Math.floor((end - body) / (2 * channels));
      const samples = new Float32Array(frames);
      for (let f = 0; f < frames; f++) {
        let sum = 0;
        for (let c = 0; c < channels; c++) sum += buf.readInt16LE(body + (f * channels + c) * 2);
        samples[f] = sum / channels / 32768;
      }
      return { samples, sampleRate };
    }
    pos = body + size + (size % 2);
  }
  throw new Error('WAV has no data chunk');
}

/** Trims near-silence from both ends, keeping a short natural pad. */
export function trimSilence(samples: Float32Array, sampleRate: number, threshold = 0.012, padMs = 60): Float32Array {
  let start = 0;
  let end = samples.length - 1;
  while (start < end && Math.abs(samples[start]!) < threshold) start++;
  while (end > start && Math.abs(samples[end]!) < threshold) end--;
  const pad = Math.round((sampleRate * padMs) / 1000);
  return samples.slice(Math.max(0, start - pad), Math.min(samples.length, end + pad + 1));
}

/** Scales so the loudest peak sits at `peak`, so every line plays at the same level. */
export function normalize(samples: Float32Array, peak = 0.89): Float32Array {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max === 0) return samples;
  const k = peak / max;
  return samples.map((s) => s * k);
}

/** Encodes mono samples as a small mp3 (mono, 48 kbps). */
export function encodeMp3(samples: Float32Array, sampleRate: number, kbps = 48): Buffer {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i]! * 32767)));
  const enc = new Mp3Encoder(1, sampleRate, kbps);
  const chunks: Uint8Array[] = [];
  const block = 1152;
  for (let i = 0; i < pcm.length; i += block) {
    const out = enc.encodeBuffer(pcm.subarray(i, i + block));
    if (out.length) chunks.push(new Uint8Array(out));
  }
  const tail = enc.flush();
  if (tail.length) chunks.push(new Uint8Array(tail));
  return Buffer.concat(chunks);
}

export function wavToMp3(wav: Buffer): Buffer {
  const { samples, sampleRate } = readWav(wav);
  return encodeMp3(normalize(trimSilence(samples, sampleRate)), sampleRate);
}
