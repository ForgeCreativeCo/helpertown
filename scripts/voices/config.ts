import { join } from 'node:path';

/** Where downloaded engines and voice models live (git-ignored). */
export const CACHE_DIR = join('scripts', 'voices', '.cache');
export const OUT_DIR = join('public', 'audio', 'generated');

/**
 * The engine and voice the bundled files were made with. Regenerating with the
 * same ones keeps every line in one voice. Override with --engine / --voice,
 * or VOICE_ENGINE / ELEVENLABS_VOICE_ID in .env.local.
 */
export const DEFAULT_ENGINE = 'elevenlabs';
/** ElevenLabs "Bill": a wise, mature, older American male voice. */
export const DEFAULT_ELEVEN_VOICE = 'pqHfZKP75CvOlQylNhV4';

/**
 * Piper voice to use (the free offline fallback: `--engine piper`). Audition others at https://rhasspy.github.io/piper-samples/
 * and pass `--voice <name>` (to both setup and generate) to switch.
 */
export const DEFAULT_PIPER_VOICE = 'en_US-ryan-high';

/** Piper release used by `npm run voices:setup`. */
export const PIPER_RELEASE = '2023.11.14-2';

/** Slightly slower than normal speech, for little ears. */
export const PIPER_LENGTH_SCALE = 1.12;

export function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

export function piperPaths(voice: string) {
  const exe = process.platform === 'win32' ? 'piper.exe' : 'piper';
  return {
    exe: join(CACHE_DIR, 'piper', exe),
    model: join(CACHE_DIR, 'voices', `${voice}.onnx`),
    modelConfig: join(CACHE_DIR, 'voices', `${voice}.onnx.json`),
  };
}
