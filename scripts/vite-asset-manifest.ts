import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Exposes `virtual:asset-manifest`: the bundled voice files and family photos
 * that actually exist. The app reads this instead of probing URLs, so it never
 * makes a request that 404s and the service worker precaches exactly these files.
 */
const VIRTUAL_ID = 'virtual:asset-manifest';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const AUDIO_EXT = /\.(mp3|ogg|m4a|wav)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

/** Maps a file's id (name without extension) to its file name. */
function scan(dir: string, ext: RegExp): Record<string, string> {
  if (!existsSync(dir)) return {};
  const out: Record<string, string> = {};
  for (const file of readdirSync(dir)) {
    if (ext.test(file)) out[file.replace(ext, '')] = file;
  }
  return out;
}

export function assetManifest(publicDir = 'public'): Plugin {
  const dirs = {
    recorded: join(publicDir, 'audio', 'recorded'),
    generated: join(publicDir, 'audio', 'generated'),
    family: join(publicDir, 'family'),
  };
  return {
    name: 'helper-town-asset-manifest',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      const manifest = {
        recorded: scan(dirs.recorded, AUDIO_EXT),
        generated: scan(dirs.generated, AUDIO_EXT),
        family: scan(dirs.family, IMAGE_EXT),
      };
      return `export default ${JSON.stringify(manifest)};`;
    },
    configureServer(server) {
      // Adding a voice file or photo during dev refreshes the manifest.
      const reload = (file: string) => {
        const norm = (p: string) => p.replaceAll('\\', '/');
        if (!Object.values(dirs).some((d) => norm(file).includes(norm(d)))) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}
