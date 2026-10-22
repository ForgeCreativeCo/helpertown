import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CACHE_DIR, PIPER_LENGTH_SCALE, piperPaths } from './config.ts';

export interface SynthJob {
  text: string;
  /** Absolute path of the WAV file to write. */
  wavPath: string;
}

/**
 * A text-to-speech engine. Engines only write WAV files; encoding to mp3 is
 * shared. To add one, implement this and register it in ENGINES.
 */
export interface Engine {
  name: string;
  /** Throws with setup instructions if the engine can't run here. */
  check(): void;
  synthesize(jobs: SynthJob[]): Promise<void>;
}

function run(cmd: string, args: string[], stdin: string): Promise<void> {
  return new Promise((res, rej) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d: Buffer) => (err += d.toString()));
    child.on('error', rej);
    child.on('close', (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited with ${code}\n${err.slice(-2000)}`))));
    child.stdin.end(stdin);
  });
}

/** Piper: natural offline neural voices. `npm run voices:setup` installs it. */
function piper(voice: string): Engine {
  const paths = piperPaths(voice);
  return {
    name: `piper (${voice})`,
    check() {
      if (!existsSync(paths.exe) || !existsSync(paths.model)) {
        throw new Error(`Piper or the voice "${voice}" isn't installed. Run: npm run voices:setup -- --voice ${voice}`);
      }
    },
    async synthesize(jobs) {
      // One process for every line: Piper reads one JSON request per line.
      const input = jobs.map((j) => JSON.stringify({ text: j.text, output_file: j.wavPath })).join('\n') + '\n';
      await run(
        resolve(paths.exe),
        ['--model', resolve(paths.model), '--json-input', '--length_scale', String(PIPER_LENGTH_SCALE), '--sentence_silence', '0.1'],
        input,
      );
    },
  };
}

/** Windows' built-in speech (no download, but robotic). Handy for a quick test. */
function sapi(): Engine {
  return {
    name: 'windows-sapi',
    check() {
      if (process.platform !== 'win32') throw new Error('The sapi engine only works on Windows.');
    },
    async synthesize(jobs) {
      const list = join(CACHE_DIR, 'sapi-jobs.json');
      writeFileSync(list, JSON.stringify(jobs));
      const script = `
        Add-Type -AssemblyName System.Speech
        $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $s.Rate = -1
        foreach ($j in (Get-Content -Raw '${resolve(list)}' | ConvertFrom-Json)) {
          $s.SetOutputToWaveFile($j.wavPath)
          $s.Speak($j.text)
        }
        $s.Dispose()`;
      await run('powershell', ['-NoProfile', '-Command', script], '');
    },
  };
}

export const ENGINES: Record<string, (voice: string) => Engine> = {
  piper,
  sapi: () => sapi(),
};
