/**
 * Gentle background music (off by default): a slow, soft, looping tune made
 * of synthesized music-box notes, sitting well under the voice and effects.
 */
const NOTE = (semis: number) => 392 * Math.pow(2, semis / 12);
// A simple original tune on a major pentatonic scale, one note per beat (0 = rest).
const TUNE = [0, 4, 7, 9, 7, 4, 2, 0, 2, 4, 7, 4, 2, -3, 0, 0, 4, 7, 9, 12, 9, 7, 4, 2, 4, 2, 0, -3, 0, 0, 0, 0];
const REST = new Set([15, 29, 30, 31]);
const BEAT = 0.52;
const LOOKAHEAD = 1.2;

export class Music {
  private timer: ReturnType<typeof setInterval> | null = null;
  private next = 0;
  private step = 0;
  private getCtx: () => { ctx: AudioContext; out: GainNode } | null;

  constructor(getCtx: () => { ctx: AudioContext; out: GainNode } | null) {
    this.getCtx = getCtx;
  }

  get playing(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.timer) return;
    this.next = 0;
    this.timer = setInterval(() => this.schedule(), 300);
    this.schedule();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    const c = this.getCtx();
    if (!c || c.ctx.state !== 'running') return;
    const { ctx, out } = c;
    if (this.next < ctx.currentTime) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + LOOKAHEAD) {
      const i = this.step % TUNE.length;
      if (!REST.has(i)) this.note(ctx, out, this.next, NOTE(TUNE[i]!));
      this.next += BEAT;
      this.step++;
    }
  }

  private note(ctx: AudioContext, out: AudioNode, t: number, freq: number): void {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 1.2);
  }
}
