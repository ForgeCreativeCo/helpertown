/**
 * Gentle background music (on by default): a children's track from
 * `public/audio/music/`, looping quietly under the voice and effects. It
 * fades in and out so it never starts or stops abruptly.
 */
const URL = `${import.meta.env.BASE_URL}audio/music/background.mp3`;
/** Relative to the effects volume, so the voice always stays on top. */
const LEVEL = 0.35;
const FADE_S = 1.5;

export class Music {
  private getCtx: () => { ctx: AudioContext; out: GainNode } | null;
  private buffer: Promise<AudioBuffer | null> | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private wanted = false;

  constructor(getCtx: () => { ctx: AudioContext; out: GainNode } | null) {
    this.getCtx = getCtx;
  }

  get playing(): boolean {
    return this.wanted;
  }

  start(): void {
    if (this.wanted) return;
    this.wanted = true;
    void this.play();
  }

  stop(): void {
    this.wanted = false;
    const c = this.getCtx();
    const { source, gain } = this;
    this.source = null;
    this.gain = null;
    if (!c || !source || !gain) return;
    const t = c.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + FADE_S);
    try {
      source.stop(t + FADE_S + 0.05);
    } catch {
      // Already stopped.
    }
  }

  private load(ctx: AudioContext): Promise<AudioBuffer | null> {
    this.buffer ??= fetch(URL)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(`music ${res.status}`))))
      .then((data) => ctx.decodeAudioData(data))
      .catch((err: unknown) => {
        // No music is fine; the game carries on. Allow a retry next time.
        console.warn('Background music unavailable', err);
        this.buffer = null;
        return null;
      });
    return this.buffer;
  }

  private async play(): Promise<void> {
    const c = this.getCtx();
    if (!c) return;
    const buffer = await this.load(c.ctx);
    // Turned off (or already playing) while it was loading.
    if (!buffer || !this.wanted || this.source) return;
    const { ctx, out } = c;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(LEVEL, ctx.currentTime + FADE_S);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain).connect(out);
    source.start();
    this.source = source;
    this.gain = gain;
  }
}
