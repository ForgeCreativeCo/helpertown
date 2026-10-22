/**
 * Generates every voice line into public/audio/generated as small mono mp3s.
 *
 *   npm run voices                         # ElevenLabs "Bill", skipping files that already exist
 *   npm run voices -- --force              # regenerate everything
 *   npm run voices -- --only fetch.        # just ids starting with "fetch."
 *   npm run voices -- --voice <voice id>   # a different ElevenLabs voice
 *   npm run voices -- --list-voices        # ElevenLabs voices this account can use
 *   npm run voices -- --engine piper       # free offline Piper (after npm run voices:setup)
 *   npm run voices -- --engine sapi        # Windows' built-in voice
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argValue, CACHE_DIR, DEFAULT_ENGINE, hasFlag, OUT_DIR } from './config.ts';
import { wavToMp3 } from './encode.ts';
import { ENGINES, listElevenVoices } from './engines.ts';
import { voiceJobs } from './jobs.ts';

async function main(): Promise<void> {
  // Secrets and engine choice live in .env.local, which git ignores.
  if (existsSync('.env.local')) process.loadEnvFile('.env.local');
  if (hasFlag('list-voices')) return listElevenVoices();

  const engineName = argValue('engine') || process.env.VOICE_ENGINE || DEFAULT_ENGINE;
  const makeEngine = ENGINES[engineName];
  if (!makeEngine) throw new Error(`Unknown engine "${engineName}". Try: ${Object.keys(ENGINES).join(', ')}`);

  mkdirSync(OUT_DIR, { recursive: true });
  const existing = new Set(readdirSync(OUT_DIR).map((f) => f.replace(/\.(mp3|ogg|m4a|wav)$/i, '')));
  const only = argValue('only');
  const all = voiceJobs().filter((j) => !only || j.id.startsWith(only));
  const todo = hasFlag('force') ? all : all.filter((j) => !existing.has(j.id));
  console.log(`${all.length} voice files; ${todo.length} to generate with ${engineName}.`);
  if (todo.length === 0) return;

  const tmp = resolve(CACHE_DIR, 'wav');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const jobs = todo.map((j) => ({ ...j, wavPath: join(tmp, `${j.id}.wav`) }));
  // Each speaker is generated in their own voice.
  for (const speaker of new Set(jobs.map((j) => j.speaker))) {
    const engine = makeEngine(argValue('voice'), speaker);
    engine.check();
    console.log(`  ${speaker}: ${engine.name}`);
    await engine.synthesize(jobs.filter((j) => j.speaker === speaker));
  }

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
