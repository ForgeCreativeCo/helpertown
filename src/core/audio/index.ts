import manifest from 'virtual:asset-manifest';
import { getLine, spokenText, voiceCandidates, type Names } from '../../content/lines';
import { blobs } from '../db';
import { AudioEngine } from './engine';
import { Sfx, type SfxName } from './sfx';
import { Music } from './music';
import { Speech } from './speech';
import { voiceSources, type VoiceSource } from './sources';
import { VoiceQueue, type SpeakOptions, type SpeakResult } from './voiceQueue';

export type { SfxName, SpeakResult, SpeakOptions };

const CACHE_LIMIT = 80;
const SILENT_MS = 900;

/** The single audio module: voice lines in priority order, a queue, preloading, and effects. */
export class Audio {
  readonly engine = new AudioEngine();
  private speech = new Speech();
  private sfxPlayer = new Sfx(() =>
    this.engine.ctx && this.engine.sfxGain ? { ctx: this.engine.ctx, out: this.engine.sfxGain } : null,
  );
  private music = new Music(() =>
    this.engine.ctx && this.engine.sfxGain ? { ctx: this.engine.ctx, out: this.engine.sfxGain } : null,
  );
  private musicOn = false;
  private parentIds = new Set<string>();
  private cache = new Map<string, Promise<AudioBuffer>>();
  private names: Names = { child: '', grandpa: '' };
  private voice: VoiceQueue<AudioBuffer>;

  constructor() {
    this.voice = new VoiceQueue<AudioBuffer>({
      resolve: (lineId) => {
        const line = getLine(lineId);
        if (!line) {
          console.warn(`Unknown voice line: ${lineId}`);
          return null;
        }
        return { sources: this.sourcesFor(lineId), text: spokenText(line, this.names) };
      },
      load: (src) => this.load(src),
      play: (buf) => this.engine.playVoice(buf),
      speak: (text) => this.speech.speak(text, this.engine.voiceVolume),
      wait: (ms) => new Promise((r) => setTimeout(r, ms)),
      silentMs: SILENT_MS,
    });
  }

  /** Reads which lines have parent recordings. Call once at boot and after recording changes. */
  async refreshParentRecordings(): Promise<void> {
    try {
      this.parentIds = new Set(await blobs.keys('recordings'));
    } catch {
      this.parentIds = new Set();
    }
    for (const key of [...this.cache.keys()]) if (key.startsWith('parent:')) this.cache.delete(key);
  }

  hasParentRecording(id: string): boolean {
    return this.parentIds.has(id);
  }

  /** Background music on or off (it only plays once audio is unlocked). */
  setMusic(on: boolean): void {
    this.musicOn = on;
    if (on && this.engine.ctx) this.music.start();
    else this.music.stop();
  }

  /** Quiet the music without changing the setting (wind-down, rest). */
  pauseMusic(paused: boolean): void {
    if (paused || !this.musicOn) this.music.stop();
    else this.setMusic(true);
  }

  setNames(names: Names): void {
    this.names = names;
  }

  setVolumes(voice: number, sfx: number): void {
    this.engine.setVolumes(voice, sfx);
  }

  /** Call from inside the start-screen tap. */
  unlock(): void {
    this.engine.unlock();
    this.speech.unlock();
    if (this.musicOn) this.music.start();
  }

  /** Called on every tap so a suspended context comes back. */
  wake(): void {
    this.engine.ensureRunning();
  }

  /** Logs how each line was played (file, speech or silent). Set by `?debug`. */
  debug = false;

  speak(lineId: string, opts?: SpeakOptions): Promise<SpeakResult> {
    const p = this.voice.speak(lineId, opts);
    if (this.debug) void p.then((r) => console.info(`[voice] ${lineId}: ${r.outcome}${r.source ? ` (${r.source.kind})` : ''}`));
    return p;
  }

  /** Drops queued lines (the current one finishes). Scenes call this when they unmount. */
  clearQueue(): void {
    this.voice.clear();
  }

  get speaking(): boolean {
    return this.voice.busy;
  }

  idle(): Promise<void> {
    return this.voice.idle();
  }

  sfx(name: SfxName): void {
    this.sfxPlayer.play(name);
  }

  /** Decodes the best file for each line ahead of time so it starts instantly. */
  preload(lineIds: readonly string[]): void {
    for (const id of lineIds) {
      const first = this.sourcesFor(id)[0];
      if (first) void this.load(first).catch(() => undefined);
    }
  }

  private sourcesFor(lineId: string): VoiceSource[] {
    const line = getLine(lineId);
    if (!line) return [];
    return voiceSources(
      voiceCandidates(line, this.names),
      { parent: this.parentIds, recorded: manifest.recorded, generated: manifest.generated },
      import.meta.env.BASE_URL,
    );
  }

  private load(src: VoiceSource): Promise<AudioBuffer> {
    const key = `${src.kind}:${src.id}`;
    const hit = this.cache.get(key);
    if (hit) {
      // Refresh recency.
      this.cache.delete(key);
      this.cache.set(key, hit);
      return hit;
    }
    const p = (async () => {
      let data: ArrayBuffer;
      if (src.kind === 'parent') {
        const blob = await blobs.get('recordings', src.id);
        if (!blob) throw new Error('missing recording');
        data = await blob.arrayBuffer();
      } else {
        const res = await fetch(src.url!);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.arrayBuffer();
      }
      return this.engine.decode(data);
    })();
    // A failed load isn't cached, so it can be retried later (e.g. after unlock).
    p.catch(() => this.cache.delete(key));
    this.cache.set(key, p);
    while (this.cache.size > CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value!);
    return p;
  }
}
