/**
 * Original sound effects, synthesized with Web Audio. Everything is short and
 * soft: no buzzers, nothing shrill. Levels sit under the voice via the sfx gain.
 */
export type SfxName =
  | 'tap'
  | 'boing'
  | 'pop'
  | 'sparkle'
  | 'whoosh'
  | 'bang'
  | 'ratchet'
  | 'whirr'
  | 'zip'
  | 'buzz'
  | 'puff'
  | 'swish'
  | 'click'
  | 'honk'
  | 'siren'
  | 'fanfare'
  | 'vroom';

type Env = { attack?: number; hold?: number; release: number; peak: number };

export class Sfx {
  private noise: AudioBuffer | null = null;
  private getCtx: () => { ctx: AudioContext; out: GainNode } | null;

  constructor(getCtx: () => { ctx: AudioContext; out: GainNode } | null) {
    this.getCtx = getCtx;
  }

  play(name: SfxName): void {
    const c = this.getCtx();
    if (!c || c.ctx.state !== 'running') return;
    try {
      SOUNDS[name](this, c.ctx, c.out, c.ctx.currentTime + 0.005);
    } catch {
      // A sound effect is never worth breaking the game over.
    }
  }

  /** One second of white noise, shared by every noisy effect. */
  noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    return this.noise;
  }
}

function envelope(ctx: AudioContext, t: number, e: Env): GainNode {
  const g = ctx.createGain();
  const a = e.attack ?? 0.005;
  const h = e.hold ?? 0;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(e.peak, t + a);
  g.gain.setValueAtTime(e.peak, t + a + h);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + h + e.release);
  return g;
}

function tone(
  ctx: AudioContext,
  out: AudioNode,
  t: number,
  type: OscillatorType,
  from: number,
  to: number,
  e: Env,
): void {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  const len = (e.attack ?? 0.005) + (e.hold ?? 0) + e.release;
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + len);
  const g = envelope(ctx, t, e);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + len + 0.05);
}

function noise(
  sfx: Sfx,
  ctx: AudioContext,
  out: AudioNode,
  t: number,
  filter: BiquadFilterType,
  from: number,
  to: number,
  e: Env,
): void {
  const src = ctx.createBufferSource();
  src.buffer = sfx.noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(from, t);
  const len = (e.attack ?? 0.005) + (e.hold ?? 0) + e.release;
  if (to !== from) f.frequency.exponentialRampToValueAtTime(to, t + len);
  const g = envelope(ctx, t, e);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + len + 0.05);
}

const NOTE = (semitones: number) => 523.25 * Math.pow(2, semitones / 12);

const SOUNDS: Record<SfxName, (s: Sfx, ctx: AudioContext, out: AudioNode, t: number) => void> = {
  tap: (_s, ctx, out, t) => tone(ctx, out, t, 'sine', 620, 420, { release: 0.09, peak: 0.35 }),
  // The gentle "not that one" wobble: a soft cartoon boing, never a buzzer.
  boing: (_s, ctx, out, t) => {
    tone(ctx, out, t, 'sine', 300, 520, { release: 0.12, peak: 0.3 });
    tone(ctx, out, t + 0.1, 'sine', 520, 340, { release: 0.18, peak: 0.25 });
  },
  pop: (_s, ctx, out, t) => tone(ctx, out, t, 'sine', 900, 180, { release: 0.12, peak: 0.45 }),
  sparkle: (_s, ctx, out, t) => {
    [12, 16, 19, 24, 28].forEach((n, i) =>
      tone(ctx, out, t + i * 0.06, 'triangle', NOTE(n), NOTE(n), { release: 0.25, peak: 0.16 }),
    );
  },
  whoosh: (s, ctx, out, t) => noise(s, ctx, out, t, 'bandpass', 400, 2400, { attack: 0.08, release: 0.25, peak: 0.3 }),
  bang: (s, ctx, out, t) => {
    tone(ctx, out, t, 'sine', 180, 60, { release: 0.16, peak: 0.6 });
    noise(s, ctx, out, t, 'lowpass', 2500, 600, { release: 0.08, peak: 0.45 });
  },
  ratchet: (s, ctx, out, t) => {
    for (let i = 0; i < 4; i++) noise(s, ctx, out, t + i * 0.07, 'highpass', 2500, 2500, { release: 0.03, peak: 0.4 });
  },
  whirr: (_s, ctx, out, t) => tone(ctx, out, t, 'triangle', 220, 330, { attack: 0.05, hold: 0.3, release: 0.15, peak: 0.2 }),
  zip: (s, ctx, out, t) => {
    noise(s, ctx, out, t, 'bandpass', 1200, 3000, { release: 0.15, peak: 0.35 });
    noise(s, ctx, out, t + 0.18, 'bandpass', 3000, 1200, { release: 0.15, peak: 0.35 });
  },
  buzz: (_s, ctx, out, t) => {
    // A friendly drill hum (low and rounded), not an error buzzer.
    tone(ctx, out, t, 'triangle', 160, 240, { attack: 0.04, hold: 0.35, release: 0.12, peak: 0.22 });
    tone(ctx, out, t, 'sine', 320, 480, { attack: 0.04, hold: 0.35, release: 0.12, peak: 0.12 });
  },
  puff: (s, ctx, out, t) => noise(s, ctx, out, t, 'lowpass', 1200, 300, { attack: 0.02, release: 0.22, peak: 0.45 }),
  swish: (s, ctx, out, t) => noise(s, ctx, out, t, 'highpass', 1500, 5000, { attack: 0.05, release: 0.22, peak: 0.25 }),
  click: (_s, ctx, out, t) => {
    tone(ctx, out, t, 'square', 1800, 1200, { release: 0.025, peak: 0.18 });
    tone(ctx, out, t + 0.04, 'sine', 900, 700, { release: 0.06, peak: 0.25 });
  },
  honk: (_s, ctx, out, t) => {
    for (const f of [330, 415]) {
      tone(ctx, out, t, 'triangle', f, f, { attack: 0.01, hold: 0.12, release: 0.08, peak: 0.18 });
      tone(ctx, out, t + 0.28, 'triangle', f, f, { attack: 0.01, hold: 0.12, release: 0.08, peak: 0.18 });
    }
  },
  // Two slow, soft wails: a toy siren, never a real one.
  siren: (_s, ctx, out, t) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(560, t);
    o.frequency.linearRampToValueAtTime(760, t + 0.35);
    o.frequency.linearRampToValueAtTime(560, t + 0.7);
    o.frequency.linearRampToValueAtTime(760, t + 1.05);
    o.frequency.linearRampToValueAtTime(560, t + 1.4);
    const g = envelope(ctx, t, { attack: 0.1, hold: 1.1, release: 0.2, peak: 0.14 });
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 1.5);
  },
  // A soft toy-engine rumble for vehicles rolling in and out.
  vroom: (s, ctx, out, t) => {
    tone(ctx, out, t, 'triangle', 70, 120, { attack: 0.08, hold: 0.5, release: 0.35, peak: 0.28 });
    tone(ctx, out, t, 'sine', 140, 220, { attack: 0.08, hold: 0.5, release: 0.35, peak: 0.12 });
    noise(s, ctx, out, t, 'lowpass', 300, 500, { attack: 0.1, hold: 0.4, release: 0.3, peak: 0.12 });
  },
  fanfare: (_s, ctx, out, t) => {
    [0, 4, 7, 12].forEach((n, i) =>
      tone(ctx, out, t + i * 0.12, 'triangle', NOTE(n), NOTE(n), { hold: i === 3 ? 0.25 : 0.05, release: 0.2, peak: 0.22 }),
    );
  },
};
