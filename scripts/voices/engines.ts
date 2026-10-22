import { ElevenLabsClient, ElevenLabsError } from '@elevenlabs/elevenlabs-js';
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Speaker } from '../../src/content/lines.ts';
import { CACHE_DIR, DEFAULT_ELEVEN_VOICES, DEFAULT_PIPER_VOICE, PIPER_LENGTH_SCALE, piperPaths } from './config.ts';

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
function piper(voiceArg?: string): Engine {
  const voice = voiceArg ?? DEFAULT_PIPER_VOICE;
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

/** 16-bit mono PCM wrapped in a WAV header. */
export function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0, 'ascii');
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVE', 8, 'ascii');
  h.write('fmt ', 12, 'ascii');
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36, 'ascii');
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const ELEVEN_RATE = 22050;

/**
 * ElevenLabs: very natural cloud voices. Only used while generating files;
 * the game itself never talks to it. Needs ELEVENLABS_API_KEY and a voice id
 * (ELEVENLABS_VOICE_ID or --voice), usually set in .env.local.
 */
function elevenlabs(voiceArg?: string, speaker: Speaker = 'pops'): Engine {
  const voice =
    voiceArg ||
    process.env[`ELEVENLABS_VOICE_${speaker.toUpperCase()}`] ||
    (speaker === 'pops' ? process.env.ELEVENLABS_VOICE_ID : undefined) ||
    DEFAULT_ELEVEN_VOICES[speaker];
  const model = process.env.ELEVENLABS_MODEL || 'eleven_v4';
  return {
    name: `elevenlabs (${voice || 'no voice'}, ${model})`,
    check() {
      if (!process.env.ELEVENLABS_API_KEY) throw new Error('No ELEVENLABS_API_KEY in .env.local (see README, "Generating voices").');
      if (!voice) throw new Error('Set ELEVENLABS_VOICE_ID in .env.local, or pass --voice <voice id>.');
    },
    async synthesize(jobs) {
      // The client reads ELEVENLABS_API_KEY itself and retries rate limits (429) with backoff.
      const client = new ElevenLabsClient({ maxRetries: 4 });
      for (const [i, job] of jobs.entries()) {
        process.stdout.write(`  ${i + 1}/${jobs.length} ${job.text}\n`);
        try {
          const stream = await client.textToSpeech.convert(voice, {
            text: job.text,
            modelId: model,
            outputFormat: `pcm_${ELEVEN_RATE}`,
            // Steady delivery and a fixed seed keep every line sounding like the same calm speaker.
            voiceSettings: { stability: 0.65, similarityBoost: 0.75 },
            seed: 7,
          });
          const pcm = Buffer.from(await new Response(stream).arrayBuffer());
          writeFileSync(job.wavPath, pcmToWav(pcm, ELEVEN_RATE));
        } catch (err) {
          throw new Error(elevenMessage(err), { cause: err });
        }
      }
    },
  };
}

function elevenMessage(err: unknown): string {
  if (err instanceof ElevenLabsError) {
    const body = typeof err.body === 'string' ? err.body : JSON.stringify(err.body);
    return `ElevenLabs error ${err.statusCode ?? ''}: ${body?.slice(0, 500) ?? err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/** Prints the voices this ElevenLabs account can use, with their ids. */
export async function listElevenVoices(): Promise<void> {
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('No ELEVENLABS_API_KEY in .env.local.');
  try {
    const { voices } = await new ElevenLabsClient().voices.getAll();
    for (const v of voices) {
      const labels = Object.values(v.labels ?? {}).join(', ');
      console.log(`${v.voiceId}  ${v.name}${labels ? `  (${labels})` : ''}`);
    }
  } catch (err) {
    throw new Error(elevenMessage(err), { cause: err });
  }
}

/** Makes an engine for one speaker. Piper and SAPI use the same voice for everyone. */
export const ENGINES: Record<string, (voice?: string, speaker?: Speaker) => Engine> = {
  piper,
  sapi: () => sapi(),
  elevenlabs,
};
