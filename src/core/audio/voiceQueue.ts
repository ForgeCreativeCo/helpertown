import type { VoiceSource } from './sources';

/**
 * Plays one voice line at a time, in order, so lines never overlap or cut each
 * other off. For each line it walks the fallback chain: voice files in priority
 * order, then runtime speech, then a short silent pause (the caller makes the
 * item glow and bounce so play continues). It never rejects and never hangs.
 */
export type SpeakOutcome = 'file' | 'speech' | 'silent' | 'dropped';

export interface SpeakResult {
  outcome: SpeakOutcome;
  source?: VoiceSource;
}

export interface VoiceDeps<B> {
  /** Voice files to try (best first) and the sentence for runtime speech. */
  resolve(lineId: string): { sources: VoiceSource[]; text: string } | null;
  load(src: VoiceSource): Promise<B>;
  /** Resolves false if audio can't play at all right now (e.g. still locked). */
  play(buf: B): Promise<boolean>;
  speak(text: string): Promise<boolean>;
  wait(ms: number): Promise<void>;
  /** How long a line that couldn't be heard holds the queue. */
  silentMs: number;
}

export interface SpeakOptions {
  /** Drop lines still waiting in the queue (the playing line always finishes). */
  replaceQueued?: boolean;
}

interface Item {
  lineId: string;
  promise: Promise<SpeakResult>;
  resolve: (r: SpeakResult) => void;
}

export class VoiceQueue<B> {
  private queue: Item[] = [];
  private current: Item | null = null;
  private deps: VoiceDeps<B>;

  constructor(deps: VoiceDeps<B>) {
    this.deps = deps;
  }

  speak(lineId: string, opts: SpeakOptions = {}): Promise<SpeakResult> {
    if (opts.replaceQueued) this.clear();
    // Asking for a line that's already playing or waiting doesn't queue it twice.
    const existing = this.current?.lineId === lineId ? this.current : this.queue.find((i) => i.lineId === lineId);
    if (existing) return existing.promise;
    let resolve!: (r: SpeakResult) => void;
    const promise = new Promise<SpeakResult>((r) => (resolve = r));
    this.queue.push({ lineId, promise, resolve });
    if (!this.current) void this.pump();
    return promise;
  }

  /** Drops every line still waiting. The line playing now finishes. */
  clear(): void {
    for (const item of this.queue.splice(0)) item.resolve({ outcome: 'dropped' });
  }

  get busy(): boolean {
    return this.current !== null || this.queue.length > 0;
  }

  /** Resolves once everything queued so far has played. */
  idle(): Promise<void> {
    const last = this.queue[this.queue.length - 1] ?? this.current;
    return last ? last.promise.then(() => undefined) : Promise.resolve();
  }

  private async pump(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.current = item;
      let result: SpeakResult;
      try {
        result = await this.playLine(item.lineId);
      } catch {
        result = { outcome: 'silent' };
      }
      this.current = null;
      item.resolve(result);
    }
  }

  private async playLine(lineId: string): Promise<SpeakResult> {
    const resolved = this.deps.resolve(lineId);
    if (!resolved) {
      await this.deps.wait(this.deps.silentMs);
      return { outcome: 'silent' };
    }
    for (const source of resolved.sources) {
      let buf: B;
      try {
        buf = await this.deps.load(source);
      } catch {
        continue; // Missing or undecodable file: try the next source.
      }
      if (await this.deps.play(buf)) return { outcome: 'file', source };
      break; // Audio output itself isn't working; files won't help.
    }
    if (await this.deps.speak(resolved.text)) return { outcome: 'speech' };
    await this.deps.wait(this.deps.silentMs);
    return { outcome: 'silent' };
  }
}
