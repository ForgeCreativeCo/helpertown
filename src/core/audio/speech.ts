/**
 * Runtime speech (Web Speech API), the fallback after recorded and generated
 * voice files. Fire tablets may have no voices at all, so every call is
 * guarded by watchdogs and the engine turns itself off after repeated failures.
 */
const START_TIMEOUT_MS = 1500;
const MAX_FAILURES = 2;

export class Speech {
  private failures = 0;
  private voice: SpeechSynthesisVoice | null = null;
  private synth: SpeechSynthesis | null = typeof speechSynthesis === 'undefined' ? null : speechSynthesis;

  constructor() {
    if (!this.synth) return;
    const pick = () => {
      const voices = this.synth?.getVoices() ?? [];
      const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
      this.voice =
        english.find((v) => v.lang === 'en-US' && v.localService) ??
        english.find((v) => v.localService) ??
        english[0] ??
        null;
    };
    pick();
    this.synth.addEventListener?.('voiceschanged', pick);
  }

  get available(): boolean {
    return !!this.synth && this.failures < MAX_FAILURES;
  }

  /** Call inside the start-screen tap: Android needs a gesture before the first utterance. */
  unlock(): void {
    if (!this.synth) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      this.synth.speak(u);
    } catch {
      // Ignore.
    }
  }

  cancel(): void {
    this.synth?.cancel();
  }

  /** Speaks text; resolves true if it actually spoke, false if it couldn't start. */
  speak(text: string, volume: number): Promise<boolean> {
    const synth = this.synth;
    if (!synth || !this.available) return Promise.resolve(false);
    return new Promise((resolve) => {
      let started = false;
      let done = false;
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) u.voice = this.voice;
      u.lang = this.voice?.lang ?? 'en-US';
      u.rate = 0.92;
      u.pitch = 1.05;
      u.volume = volume;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(startTimer);
        clearTimeout(endTimer);
        if (!ok) {
          this.failures++;
          synth.cancel();
        } else {
          this.failures = 0;
        }
        resolve(ok);
      };
      u.onstart = () => {
        started = true;
      };
      u.onend = () => finish(true);
      u.onerror = () => finish(started);
      const startTimer = setTimeout(() => {
        if (!started && !synth.speaking) finish(false);
      }, START_TIMEOUT_MS);
      // Some engines never fire 'end'; never let a line hang the queue.
      const endTimer = setTimeout(() => finish(true), 2500 + text.length * 110);
      synth.cancel();
      synth.speak(u);
    });
  }
}
