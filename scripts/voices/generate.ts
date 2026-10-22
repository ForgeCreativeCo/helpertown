/**
 * Generates every voice line into public/audio/generated as small mono mp3s.
 *
 *   npm run voices                         # Piper, skipping files that already exist
 *   npm run voices -- --force              # regenerate everything
 *   npm run voices -- --only fetch.        # just ids starting with "fetch."
 *   npm run voices -- --engine sapi        # Windows' built-in voice instead
 *   npm run voices -- --voice en_US-joe-medium
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argValue, CACHE_DIR, DEFAULT_PIPER_VOICE, hasFlag, OUT_DIR } from './config.ts';
import { wavToMp3 } from './encode.ts';
import { ENGINES } from './engines.ts';
import { voiceJobs } from './jobs.ts';

async function main(): Promise<void> {
  const engineName = argValue('engine') ?? 'piper';
  const makeEngine = ENGINES[engineName];
  if (!makeEngine) throw new Error(`Unknown engine "${engineName}". Try: ${Object.keys(ENGINES).join(', ')}`);
  const engine = makeEngine(argValue('voice') ?? DEFAULT_PIPER_VOICE);
  engine.check();

  mkdirSync(OUT_DIR, { recursive: true });
  const existing = new Set(readdirSync(OUT_DIR).map((f) => f.replace(/\.(mp3|ogg|m4a|wav)$/i, '')));
  const only = argValue('only');
  const all = voiceJobs().filter((j) => !only || j.id.startsWith(only));
  const todo = hasFlag('force') ? all : all.filter((j) => !existing.has(j.id));
  console.log(`${all.length} voice files; ${todo.length} to generate with ${engine.name}.`);
  if (todo.length === 0) return;

  const tmp = resolve(CACHE_DIR, 'wav');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const jobs = todo.map((j) => ({ ...j, wavPath: join(tmp, `${j.id}.wav`) }));
  await engine.synthesize(jobs);

  let bytes = 0;
  for (const j of jobs) {
    if (!existsSync(j.wavPath)) {
      console.warn(`  missing output for ${j.id}`);
      continue;
    }
    const mp3 = wavToMp3(readFileSync(j.wavPath));
    writeFileSync(join(OUT_DIR, `${j.id}.mp3`), mp3);
    bytes += mp3.length;
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`Wrote ${jobs.length} files (${(bytes / 1024).toFixed(0)} KB) to ${OUT_DIR}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
