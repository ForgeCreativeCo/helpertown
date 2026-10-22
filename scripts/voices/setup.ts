/**
 * Downloads the Piper text-to-speech engine and a voice model into
 * scripts/voices/.cache. Run once: `npm run voices:setup [-- --voice en_US-ryan-high]`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { argValue, CACHE_DIR, DEFAULT_PIPER_VOICE, PIPER_RELEASE, piperPaths } from './config.ts';

function piperAsset(): string {
  const { platform, arch } = process;
  if (platform === 'win32') return 'piper_windows_amd64.zip';
  if (platform === 'darwin') return arch === 'arm64' ? 'piper_macos_aarch64.tar.gz' : 'piper_macos_x64.tar.gz';
  return arch === 'arm64' ? 'piper_linux_aarch64.tar.gz' : 'piper_linux_x86_64.tar.gz';
}

async function download(url: string, dest: string): Promise<void> {
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function extract(archive: string, into: string): void {
  const result =
    process.platform === 'win32'
      ? spawnSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -Force -Path '${archive}' -DestinationPath '${into}'`], {
          stdio: 'inherit',
        })
      : spawnSync('tar', ['-xzf', archive, '-C', into], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Could not extract ${archive}`);
}

async function main(): Promise<void> {
  const voice = argValue('voice') ?? DEFAULT_PIPER_VOICE;
  const paths = piperPaths(voice);
  mkdirSync(join(CACHE_DIR, 'voices'), { recursive: true });

  if (existsSync(paths.exe)) {
    console.log('Piper is already installed.');
  } else {
    const asset = piperAsset();
    const archive = join(CACHE_DIR, asset);
    await download(`https://github.com/rhasspy/piper/releases/download/${PIPER_RELEASE}/${asset}`, archive);
    extract(archive, CACHE_DIR);
    if (!existsSync(paths.exe)) throw new Error(`Piper not found at ${paths.exe} after extracting`);
  }

  if (existsSync(paths.model) && existsSync(paths.modelConfig)) {
    console.log(`Voice ${voice} is already downloaded.`);
  } else {
    // e.g. en_US-ryan-high → en/en_US/ryan/high/
    const [lang, name, quality] = voice.split('-');
    if (!lang || !name || !quality) throw new Error(`Voice names look like en_US-ryan-high, got "${voice}"`);
    const base = `https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/${lang.split('_')[0]}/${lang}/${name}/${quality}/${voice}`;
    await download(`${base}.onnx`, paths.model);
    await download(`${base}.onnx.json`, paths.modelConfig);
  }
  console.log('Ready. Now run: npm run voices');
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
