/**
 * Voice playback priority, as a pure function so it's unit-tested:
 *   1. a parent recording made in the app (IndexedDB)
 *   2. a bundled real recording  (public/audio/recorded)
 *   3. a bundled generated voice (public/audio/generated)
 * Within each source the named version beats the name-free one. Runtime speech
 * and the silent glow-and-bounce fallback come after these, in voice.ts.
 */
export type VoiceSourceKind = 'parent' | 'recorded' | 'generated';

export interface VoiceSource {
  kind: VoiceSourceKind;
  /** Voice file id, e.g. `fetch.ask.hammer` or `start.hello__c-sam__g-pops`. */
  id: string;
  /** URL for bundled files; parent recordings are read from IndexedDB. */
  url?: string;
}

export interface VoiceAvailability {
  parent: { has(id: string): boolean };
  recorded: Record<string, string>;
  generated: Record<string, string>;
}

export const SOURCE_ORDER: readonly VoiceSourceKind[] = ['parent', 'recorded', 'generated'];

export function voiceSources(candidates: readonly string[], avail: VoiceAvailability, base = '/'): VoiceSource[] {
  const out: VoiceSource[] = [];
  for (const kind of SOURCE_ORDER) {
    for (const id of candidates) {
      if (kind === 'parent') {
        if (avail.parent.has(id)) out.push({ kind, id });
        continue;
      }
      const file = avail[kind][id];
      if (file) out.push({ kind, id, url: `${base}audio/${kind}/${file}` });
    }
  }
  return out;
}
