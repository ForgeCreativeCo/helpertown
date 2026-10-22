import type { StickerId } from '../content/stickers';
import { fromMarkup, s } from '../core/svg';
import { DARK_METAL, INK, METAL } from './palette';
import { stickerArt } from './stickers';

/**
 * Post Office art. Letters and numbers are drawn as big, chunky text with a
 * dark outline (the only place besides license plates where a child sees them).
 */
const O = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const O8 = `stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;

/** A big outlined letter or number centered on (cx, cy). */
export function glyph(text: string, cx: number, cy: number, size: number, fill: string): SVGTextElement {
  const t = s('text', {
    x: cx,
    y: cy,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': size,
    fill,
    stroke: INK,
    'stroke-width': Math.max(4, size * 0.08),
    'stroke-linejoin': 'round',
    'paint-order': 'stroke',
  });
  t.setAttribute('font-family', "'Arial Rounded MT Bold', 'Nunito', system-ui, sans-serif");
  t.setAttribute('font-weight', '900');
  t.textContent = text;
  return t;
}

/** An envelope with a big letter on it, in a 160×160 box. */
export function envelopeArt(letter: string, color: string): SVGGElement {
  const g = fromMarkup(`
    <rect x="12" y="36" width="136" height="96" rx="12" fill="#fffaf0" ${O}/>
    <path d="M14 42 L80 88 L146 42" fill="none" ${O}/>
    <rect x="112" y="46" width="24" height="28" rx="4" fill="${color}" stroke="${INK}" stroke-width="3"/>`);
  g.append(glyph(letter, 70, 100, 62, color));
  return g;
}

/** A letter tile (for spelling his name), in a 160×160 box. */
export function letterTileArt(letter: string, color: string): SVGGElement {
  const g = fromMarkup(`
    <rect x="20" y="20" width="120" height="120" rx="24" fill="#fffaf0" ${O8}/>
    <rect x="30" y="28" width="100" height="14" rx="7" fill="#ffffff"/>`);
  g.append(glyph(letter, 80, 86, 92, color));
  return g;
}

/** The big blue public mailbox, standing on the floor; slot near the top. Box ~200×400. */
export function bigMailbox(x: number, floor: number): SVGGElement {
  const top = floor - 400;
  return fromMarkup(`
    <rect x="${x + 36}" y="${floor - 70}" width="22" height="70" fill="${DARK_METAL}" ${O}/>
    <rect x="${x + 142}" y="${floor - 70}" width="22" height="70" fill="${DARK_METAL}" ${O}/>
    <path d="M${x} ${floor - 70} V${top + 90} Q${x} ${top} ${x + 100} ${top} Q${x + 200} ${top} ${x + 200} ${top + 90} V${floor - 70} Z" fill="#3d7fe0" ${O8}/>
    <rect x="${x + 40}" y="${top + 70}" width="120" height="22" rx="11" fill="${INK}"/>
    <path d="M${x + 30} ${top + 60} Q${x + 100} ${top + 40} ${x + 170} ${top + 60}" fill="none" stroke="#7fb4ef" stroke-width="8" stroke-linecap="round"/>
    <path d="M${x + 60} ${top + 170} H${x + 140} V${top + 230} H${x + 60} Z M${x + 60} ${top + 170} L${x + 100} ${top + 205} L${x + 140} ${top + 170}" fill="#fffaf0" ${O}/>
    <rect x="${x + 70}" y="${top + 290}" width="60" height="16" rx="8" fill="#7fb4ef" ${O}/>`);
}

/** Where the big mailbox's slot is, for a mailbox drawn at (x, floor). */
export function mailboxSlot(x: number, floor: number): { x: number; y: number } {
  return { x: x + 100, y: floor - 400 + 81 };
}

/** His own red mailbox on a post, with a flag. Box ~220×300 above the floor. */
export function myMailbox(x: number, floor: number): SVGGElement {
  return fromMarkup(`
    <rect x="${x + 96}" y="${floor - 170}" width="28" height="170" fill="#a0612f" ${O}/>
    <path d="M${x} ${floor - 170} V${floor - 250} Q${x} ${floor - 300} ${x + 50} ${floor - 300} H${x + 170} Q${x + 220} ${floor - 300} ${x + 220} ${floor - 250} V${floor - 170} Z" fill="#e4473b" ${O8}/>
    <path d="M${x + 20} ${floor - 270} Q${x + 60} ${floor - 292} ${x + 120} ${floor - 290}" fill="none" stroke="#ff8a7d" stroke-width="8" stroke-linecap="round"/>
    <rect x="${x + 214}" y="${floor - 296}" width="12" height="70" rx="4" fill="${DARK_METAL}" ${O}/>
    <rect x="${x + 220}" y="${floor - 296}" width="44" height="28" rx="4" fill="#f2b33d" ${O}/>`);
}

/** A mail truck (white van, blue stripe, envelope on the side), in the 480×300 vehicle box. */
export function mailTruck(): SVGGElement {
  const wheel = (cx: number) => `
    <circle cx="${cx}" cy="250" r="42" fill="#333840" ${O8}/>
    <circle cx="${cx}" cy="250" r="20" fill="${METAL}" ${O}/>`;
  return fromMarkup(`
    <rect x="22" y="70" width="330" height="150" rx="22" fill="#f4f4f4" ${O8}/>
    <path d="M352 220 V110 Q352 92 370 92 H404 Q424 92 434 110 L460 158 Q466 172 466 186 V220 Z" fill="#f4f4f4" ${O8}/>
    <path d="M370 110 H400 Q408 110 414 120 L434 158 H370 Z" fill="#bfe7f7" ${O}/>
    <rect x="22" y="170" width="444" height="22" fill="#3d7fe0"/>
    <path d="M90 100 H200 V156 H90 Z M90 100 L145 134 L200 100" fill="#fffaf0" ${O}/>
    <rect x="232" y="104" width="90" height="56" rx="8" fill="none" stroke="#9aa3ad" stroke-width="5"/>
    <rect x="22" y="70" width="444" height="150" rx="22" fill="none"/>
    <circle cx="450" cy="190" r="15" fill="#fff6b0" ${O}/><circle cx="453" cy="191" r="6" fill="${INK}"/>
    ${wheel(110)}${wheel(380)}`);
}

/** A brown package, in a 100×100 box. */
export function packageArt(): SVGGElement {
  return fromMarkup(`
    <rect x="16" y="26" width="68" height="60" rx="6" fill="#c98a4b" ${O}/>
    <path d="M16 46 H84 M50 26 V86" stroke="#f2d69a" stroke-width="10"/>
    <rect x="16" y="26" width="68" height="60" rx="6" fill="none" ${O}/>`);
}

/** A house on the street with a big number over its door, in a 240×300 box (ground at 300). */
export function numberHouse(n: number, wall: string, roof: string): SVGGElement {
  const g = fromMarkup(`
    <rect x="24" y="110" width="192" height="186" rx="10" fill="${wall}" ${O8}/>
    <path d="M6 120 L120 22 L234 120 Z" fill="${roof}" ${O8}/>
    <path d="M94 296 V226 Q94 204 120 204 Q146 204 146 226 V296 Z" fill="#8a5a35" ${O}/>
    <circle cx="136" cy="254" r="5" fill="#f2b33d"/>
    <rect x="40" y="200" width="40" height="40" rx="6" fill="#bfe7f7" ${O}/>
    <rect x="160" y="200" width="40" height="40" rx="6" fill="#bfe7f7" ${O}/>
    <rect x="64" y="126" width="112" height="72" rx="14" fill="#fffaf0" ${O}/>`);
  g.append(glyph(String(n), 120, 164, 64, '#3d7fe0'));
  return g;
}

/** A postage stamp: a sticker picture inside a perforated frame, in a 100×100 box. */
export function stampArt(id: StickerId): SVGGElement {
  const holes: string[] = [];
  for (let i = 0; i <= 8; i++) {
    const p = 8 + i * 10.5;
    holes.push(`<circle cx="${p}" cy="6" r="4" fill="#cfe3f2"/><circle cx="${p}" cy="94" r="4" fill="#cfe3f2"/>`);
    holes.push(`<circle cx="6" cy="${p}" r="4" fill="#cfe3f2"/><circle cx="94" cy="${p}" r="4" fill="#cfe3f2"/>`);
  }
  const frame = fromMarkup(`<rect x="4" y="4" width="92" height="92" rx="4" fill="#fffaf0" ${O}/>${holes.join('')}`);
  const pic = stickerArt(id);
  pic.setAttribute('transform', 'translate(16 16) scale(0.68)');
  return s('g', {}, [frame, pic]);
}

/** The Post Office building for the town map, drawn in a 460×380 box (ground at 380). */
export function postOfficeBuilding(): SVGGElement {
  const g = fromMarkup(`
    <ellipse cx="230" cy="380" rx="230" ry="16" fill="#5e8f4e" opacity="0.6"/>
    <rect x="30" y="120" width="400" height="260" rx="10" fill="#cfe3f2" ${O8}/>
    <rect x="10" y="96" width="440" height="46" rx="10" fill="#3d7fe0" ${O8}/>
    <path d="M40 118 H420" stroke="#7fb4ef" stroke-width="8" stroke-linecap="round"/>
    <rect x="186" y="230" width="88" height="150" rx="10" fill="#3d7fe0" ${O8}/>
    <circle cx="256" cy="310" r="7" fill="#f2b33d" stroke="${INK}" stroke-width="3"/>
    <rect x="56" y="210" width="100" height="84" rx="8" fill="#bfe7f7" ${O}/>
    <rect x="304" y="210" width="100" height="84" rx="8" fill="#bfe7f7" ${O}/>
    <path d="M180 154 H280 V214 H180 Z M180 154 L230 190 L280 154" fill="#fffaf0" ${O}/>
    <rect x="224" y="20" width="12" height="80" fill="${DARK_METAL}" ${O}/>
    <path d="M236 24 H300 L288 42 L300 60 H236 Z" fill="#e4473b" ${O}/>
    <!-- A little blue mailbox out front -->
    <path d="M380 380 V330 Q380 308 402 308 Q424 308 424 330 V380 Z" fill="#3d7fe0" ${O}/>
    <rect x="390" y="324" width="24" height="6" rx="3" fill="${INK}"/>`);
  return g;
}

/** A roll-down shutter for the post office window (the wind-down). Animate scaleY 0 → 1. */
export function shutter(x: number, y: number, w: number, h: number): SVGGElement {
  const slats: string[] = [];
  for (let sy = y + 6; sy + 30 <= y + h; sy += 36) slats.push(`<rect x="${x + 6}" y="${sy}" width="${w - 12}" height="30" rx="4" fill="#d9e3ea" stroke="${INK}" stroke-width="4"/>`);
  const g = fromMarkup(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#b8c4cc"/>${slats.join('')}`);
  g.style.transformBox = 'fill-box';
  g.style.transformOrigin = '50% 0%';
  g.style.transform = 'scaleY(0)';
  return g;
}


const WALL = '#cfe3f2';
export const POST_BACKDROP = '#b9cfe0';

/** Mail cubbies (pigeonholes) with envelopes poking out. */
function cubbies(x: number, y: number, cols: number, rows: number): string {
  const out: string[] = [`<rect x="${x}" y="${y}" width="${cols * 64 + 16}" height="${rows * 56 + 16}" rx="10" fill="#c98a4b" ${O8}/>`];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x + 8 + c * 64;
      const cy = y + 8 + r * 56;
      out.push(`<rect x="${cx}" y="${cy}" width="58" height="50" rx="6" fill="#8a5a35" stroke="${INK}" stroke-width="4"/>`);
      if ((r * cols + c) % 3 !== 1) out.push(`<rect x="${cx + 8}" y="${cy + 18}" width="42" height="28" rx="3" fill="#fffaf0" stroke="${INK}" stroke-width="3"/>`);
    }
  }
  return out.join('');
}

/** The post office room: blue walls, cubbies, a big window onto the street. */
export function postBack(): SVGGElement {
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1500" fill="${WALL}"/>
    <rect x="-1280" y="-800" width="3840" height="110" fill="#b9d3e6"/>
    ${cubbies(470, 56, 5, 3)}
    <!-- Window onto the street, where the mail truck is parked -->
    <rect x="860" y="70" width="380" height="300" rx="16" fill="#a9dcf5" ${O8}/>
    <rect x="868" y="290" width="364" height="72" fill="#7cc46b"/>
    <rect x="868" y="330" width="364" height="32" fill="#6b7480"/>
    <rect x="-1280" y="690" width="3840" height="1000" fill="#c9b79a"/>
    <path d="M-1280 740 H2560" stroke="#b5a283" stroke-width="5"/>
  `);
}

/** The window frame drawn over the parked truck. */
export function postWindowFrame(): SVGGElement {
  return fromMarkup(`<rect x="860" y="70" width="380" height="300" rx="16" fill="none" ${O8}/>`);
}

/** The service counter in front of Pops. */
export function postCounter(): SVGGElement {
  return fromMarkup(`
    <rect x="380" y="560" width="520" height="140" fill="#3d7fe0" ${O8}/>
    <rect x="404" y="580" width="472" height="22" rx="8" fill="#7fb4ef"/>
    <rect x="364" y="516" width="552" height="50" rx="10" fill="#d9a066" ${O8}/>
    <rect x="376" y="526" width="528" height="10" fill="#ecc08a"/>`);
}

/** The cork board where his stamps go. */
export function stampBoard(): SVGGElement {
  return fromMarkup(`
    <rect x="180" y="60" width="262" height="196" rx="14" fill="#d9a066" ${O8}/>
    <rect x="196" y="76" width="230" height="164" rx="8" fill="#e6c48f"/>`);
}

/** Where stamps sit on the board (stage coords), newest last. */
export const STAMP_SLOTS = [
  { x: 254, y: 114 },
  { x: 368, y: 114 },
  { x: 254, y: 200 },
  { x: 368, y: 200 },
];
