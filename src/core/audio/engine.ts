/**
 * The shared AudioContext with separate voice and effects gains. The first tap
 * on the start screen unlocks it; later taps resume it if the tablet suspended it.
 */
type Ctor = typeof AudioContext;

export class AudioEngine {
  ctx: AudioContext | null = null;
  voiceGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  private volumes = { voice: 1, sfx: 0.55 };

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void this.ctx?.suspend().catch(() => undefined);
      else this.ensureRunning();
    });
  }

  /** Call from inside a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const AC: Ctor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch {
        return;
      }
      this.voiceGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.voiceGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.applyVolumes();
    }
    this.ensureRunning();
    // A one-sample silent buffer started inside the gesture is what unlocks some browsers.
    try {
      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start();
    } catch {
      // Ignore: resume() above is the main unlock.
    }
  }

  ensureRunning(): void {
    if (this.ctx && this.ctx.state !== 'running' && !document.hidden) {
      void this.ctx.resume().catch(() => undefined);
    }
  }

  get running(): boolean {
    return this.ctx?.state === 'running';
  }

  setVolumes(voice: number, sfx: number): void {
    this.volumes = { voice, sfx };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (this.voiceGain) this.voiceGain.gain.value = this.volumes.voice;
    if (this.sfxGain) this.sfxGain.gain.value = this.volumes.sfx;
  }

  get voiceVolume(): number {
    return this.volumes.voice;
  }

  async decode(data: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.ctx) throw new Error('audio locked');
    return this.ctx.decodeAudioData(data);
  }

  /** Plays a buffer on the voice bus; resolves when it ends (or a watchdog fires). */
  async playVoice(buffer: AudioBuffer): Promise<boolean> {
    const ctx = this.ctx;
    const gain = this.voiceGain;
    if (!ctx || !gain) return false;
    if (ctx.state !== 'running' && !document.hidden) {
      // Just unlocked, or the tablet suspended it: give resume() a moment.
      await Promise.race([ctx.resume().catch(() => undefined), new Promise((r) => setTimeout(r, 400))]);
    }
    if (ctx.state !== 'running') return false;
    return new Promise((resolve) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(watchdog);
        resolve(true);
      };
      src.onended = finish;
      // If 'ended' never arrives (context suspended mid-line), don't hang the queue.
      const watchdog = setTimeout(finish, buffer.duration * 1000 + 800);
      src.start();
    });
  }
}
