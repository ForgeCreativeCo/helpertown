/**
 * Renders the app icon (public/icon.svg) to the PNGs the PWA manifest and
 * tablets need. Run after changing the icon: `npm run icons`.
 *
 *   pwa-192.png, pwa-512.png   the rounded icon as drawn
 *   maskable-512.png           full-bleed, art kept inside the 80% safe zone,
 *                              so launchers can crop it to any shape
 *   apple-touch-icon.png       180×180, full-bleed (the OS rounds the corners)
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = 'public';
const svg = readFileSync(join(PUBLIC, 'icon.svg'), 'utf8');

/** The icon's art without its rounded background, for re-framing. */
const art = svg.replace(/<rect width="512" height="512" rx="112" fill="([^"]+)"\/>/, '');
const background = /<rect width="512" height="512" rx="112" fill="([^"]+)"\/>/.exec(svg)?.[1] ?? '#f2b33d';
const inner = art.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function fullBleed(artScale: number): string {
  const offset = (512 * (1 - artScale)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${background}"/>
    <g transform="translate(${offset} ${offset}) scale(${artScale})">${inner}</g>
  </svg>`;
}

function render(source: string, size: number, file: string): void {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(PUBLIC, file), png);
  console.log(`${file} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

render(svg, 192, 'pwa-192.png');
render(svg, 512, 'pwa-512.png');
render(fullBleed(0.7), 512, 'maskable-512.png');
render(fullBleed(0.8), 180, 'apple-touch-icon.png');
