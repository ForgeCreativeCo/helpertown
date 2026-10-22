import { join } from 'node:path';

/** Where downloaded engines and voice models live (git-ignored). */
export const CACHE_DIR = join('scripts', 'voices', '.cache');
export const OUT_DIR = join('public', 'audio', 'generated');

/**
 * Piper voice to use. Audition others at https://rhasspy.github.io/piper-samples/
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
