import { DECO_COLORS, getDeco, getFlavor, type BakeItem, type DecoId, type DecoShape, type FlavorId } from '../content/bakery';
import { fromMarkup, s } from '../core/svg';
import { INK } from './palette';

/** Baking art: muffins, cookies, icing decorations, the oven and the bakery shelf. */
const O = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const O8 = `stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;
const COOKIE = '#e0a466';

function heartPath(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy + r * 0.9} C${cx - r * 1.6} ${cy - r * 0.1} ${cx - r * 0.9} ${cy - r * 1.3} ${cx} ${cy - r * 0.45} C${cx + r * 0.9} ${cy - r * 1.3} ${cx + r * 1.6} ${cy - r * 0.1} ${cx} ${cy + r * 0.9} Z`;
}

function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.48;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function shapeMarkup(shape: DecoShape, color: string, cx: number, cy: number, r: number, stroke = 5): string {
  const o = `stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round"`;
  const shine = `<circle cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.16}" fill="#ffffff" opacity="0.8"/>`;
  switch (shape) {
    case 'heart':
      return `<path d="${heartPath(cx, cy, r)}" fill="${color}" ${o}/>${shine}`;
    case 'star':
      return `<path d="${starPath(cx, cy + r * 0.05, r * 1.1)}" fill="${color}" ${o}/>${shine}`;
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${r * 0.85}" fill="${color}" ${o}/>${shine}`;
  }
}

/** One icing decoration, in a 100×100 box (center 50,50). */
export function decoArt(id: DecoId): SVGGElement {
  const d = getDeco(id);
  return fromMarkup(shapeMarkup(d.shape, DECO_COLORS[d.color], 50, 50, 38, 6));
}

/** Where decorations sit on a cookie of radius 1 (scaled by the caller). */
export const COOKIE_SPOTS = [
  { x: -0.42, y: -0.3 },
  { x: 0.4, y: -0.22 },
  { x: 0, y: 0.42 },
];

function cookieBase(cx: number, cy: number, r: number): string {
  const crumbs = [
    [-0.55, 0.1],
    [0.15, -0.6],
    [0.6, 0.35],
    [-0.2, 0.62],
    [0.05, 0.05],
  ]
    .map(([x, y]) => `<circle cx="${cx + x! * r}" cy="${cy + y! * r}" r="${r * 0.05}" fill="#b5773d"/>`)
    .join('');
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${COOKIE}" stroke="${INK}" stroke-width="${Math.max(4, r * 0.06)}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="none" stroke="#ecc08a" stroke-width="${r * 0.08}"/>
    ${crumbs}`;
}

/** A decorated cookie, in a 100×100 box. */
export function cookieArt(decos: DecoId[]): SVGGElement {
  const parts = decos.map((id, i) => {
    const d = getDeco(id);
    const spot = COOKIE_SPOTS[i % COOKIE_SPOTS.length]!;
    return shapeMarkup(d.shape, DECO_COLORS[d.color], 50 + spot.x * 44, 50 + spot.y * 44, 14, 3);
  });
  return fromMarkup(cookieBase(50, 50, 44) + parts.join(''));
}

/** The big plain cookie for decorating, centered on (0,0), radius 140, on a plate. */
export function bigCookie(): SVGGElement {
  return fromMarkup(`
    <ellipse cx="0" cy="118" rx="200" ry="44" fill="#ffffff" ${O8}/>
    <ellipse cx="0" cy="112" rx="160" ry="30" fill="#eef4f7"/>
    ${cookieBase(0, 0, 140)}`);
}

/** A muffin in a paper cup, in a 100×100 box. */
export function muffinArt(flavor: FlavorId): SVGGElement {
  const f = getFlavor(flavor);
  const dots = [
    [36, 34],
    [56, 28],
    [66, 44],
    [44, 48],
  ]
    .map(([x, y]) =>
      flavor === 'banana'
        ? `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="${f.color}" stroke="${INK}" stroke-width="2.5"/>`
        : `<circle cx="${x}" cy="${y}" r="5" fill="${f.color}" stroke="${INK}" stroke-width="2.5"/>`,
    )
    .join('');
  return fromMarkup(`
    <path d="M22 54 H78 L70 92 H30 Z" fill="#f7a8cf" ${O}/>
    <path d="M34 56 L38 90 M50 56 V90 M64 56 L62 90" stroke="#e07bb0" stroke-width="4"/>
    <path d="M16 58 Q12 30 34 22 Q50 8 66 22 Q88 30 84 58 Z" fill="#e0a466" ${O}/>
    <path d="M28 34 Q36 24 48 24" fill="none" stroke="#f3c890" stroke-width="5" stroke-linecap="round"/>
    ${dots}`);
}

/** Something on the bakery shelf, in a 100×100 box. */
export function bakeItemArt(item: BakeItem): SVGGElement {
  return item.kind === 'muffin' ? muffinArt(item.flavor) : cookieArt(item.decos);
}

/** One egg, in a 100×100 box. */
export function eggArt(): SVGGElement {
  return fromMarkup(`
    <ellipse cx="50" cy="56" rx="32" ry="40" fill="#fffaf0" ${O}/>
    <ellipse cx="38" cy="40" rx="8" ry="13" fill="#ffffff"/>`);
}

/** A cracked egg shell (two halves), in a 100×100 box. */
export function crackedEggArt(): SVGGElement {
  return fromMarkup(`
    <path d="M18 60 Q18 30 50 22 L44 40 L54 50 L42 62 Z" fill="#fffaf0" ${O}/>
    <path d="M82 60 Q82 30 56 22 L62 40 L52 50 L64 62 Z" fill="#fffaf0" ${O}/>`);
}

/** One piece of fruit to count into the bowl, in a 100×100 box. */
export function fruitPieceArt(flavor: FlavorId): SVGGElement {
  switch (flavor) {
    case 'blueberry':
      return fromMarkup(`<circle cx="50" cy="52" r="30" fill="#4a5fc1" ${O}/><path d="M42 30 l8 8 l8 -8" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="44" r="6" fill="#c8d1ff"/>`);
    case 'banana':
      return fromMarkup(`<ellipse cx="50" cy="52" rx="34" ry="26" fill="#fff3c4" ${O}/><ellipse cx="50" cy="52" rx="22" ry="15" fill="#f5d33d"/><circle cx="50" cy="52" r="4" fill="#c79a10"/>`);
    case 'strawberry':
      return fromMarkup(`
        <path d="M50 90 Q20 66 22 42 Q24 26 50 28 Q76 26 78 42 Q80 66 50 90 Z" fill="#e4473b" ${O}/>
        <path d="M34 30 L42 18 L50 26 L58 18 L66 30 Q50 38 34 30 Z" fill="#3fae5a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <g fill="#ffe27a"><circle cx="40" cy="50" r="3"/><circle cx="58" cy="48" r="3"/><circle cx="50" cy="66" r="3"/></g>`);
  }
}

/** A wooden spoon (handle up), drawn around (0,0) at the bowl's center. */
export function spoonArt(): SVGGElement {
  return fromMarkup(`
    <path d="M10 -150 L-4 -30" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
    <path d="M10 -150 L-4 -30" stroke="#d9a066" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="-6" cy="-20" rx="18" ry="26" fill="#d9a066" ${O}/>`);
}

/** A muffin tin seen from the front, in a 220×100 box; `baked` shows risen muffins. */
export function muffinTin(flavor: FlavorId, baked: boolean): SVGGElement {
  const f = getFlavor(flavor);
  const cups = [40, 110, 180]
    .map((x) =>
      baked
        ? `<path d="M${x - 30} 46 Q${x - 34} 14 ${x} 10 Q${x + 34} 14 ${x + 30} 46 Z" fill="#e0a466" ${O}/>
           <circle cx="${x - 8}" cy="28" r="5" fill="${f.color}" stroke="${INK}" stroke-width="2.5"/><circle cx="${x + 10}" cy="24" r="5" fill="${f.color}" stroke="${INK}" stroke-width="2.5"/>`
        : `<ellipse cx="${x}" cy="46" rx="28" ry="9" fill="#f3d7a6" stroke="${INK}" stroke-width="4"/>`,
    )
    .join('');
  return fromMarkup(`
    ${cups}
    <rect x="4" y="44" width="212" height="44" rx="12" fill="#9aa3ad" ${O}/>
    ${[40, 110, 180].map((x) => `<path d="M${x - 26} 52 Q${x} 80 ${x + 26} 52" fill="#cfd6dd" stroke="${INK}" stroke-width="4"/>`).join('')}`);
}

/** The oven on the right of the baking scene; `glow` is the warm light inside (fade it in). */
export function oven(): { oven: SVGGElement; glow: SVGRectElement } {
  const glow = s('rect', { x: 1006, y: 452, width: 196, height: 120, rx: 14, fill: '#ffb347', opacity: 0, class: 'no-hit' });
  const g = fromMarkup(`
    <rect x="970" y="320" width="270" height="400" rx="22" fill="#f4f4f4" ${O8}/>
    <rect x="970" y="320" width="270" height="80" rx="22" fill="#d9e3ea" ${O8}/>
    <circle cx="1020" cy="360" r="20" fill="#4a4f57" ${O}/><path d="M1020 360 L1020 344" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="1090" cy="360" r="20" fill="#4a4f57" ${O}/><path d="M1090 360 L1104 352" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="1180" cy="360" r="14" fill="#e4473b" ${O}/>
    <rect x="1000" y="420" width="210" height="18" rx="9" fill="#9aa3ad" ${O}/>
    <rect x="996" y="446" width="216" height="132" rx="16" fill="#3a3f46" ${O}/>
  `);
  g.append(glow);
  g.append(fromMarkup(`<rect x="996" y="446" width="216" height="132" rx="16" fill="none" ${O}/><path d="M1012 462 L1060 462" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.5"/>`));
  return { oven: g, glow };
}

/** The baking tray of plain cookies on the hub counter (opens Decorate Cookies). */
export function cookieTray(): SVGGElement {
  return fromMarkup(`
    <rect x="712" y="500" width="236" height="22" rx="8" fill="#9aa3ad" ${O}/>
    ${cookieBase(758, 476, 30)}
    ${cookieBase(830, 470, 34)}
    ${cookieBase(902, 478, 28)}
    ${shapeMarkup('heart', DECO_COLORS.red, 830, 466, 13, 3)}`);
}

/** The open bakery shelf on the hub wall (two boards). Items are added by the hub. */
export function bakeryShelfArt(): SVGGElement {
  return fromMarkup(`
    <rect x="166" y="56" width="262" height="196" rx="14" fill="#f3e2c0" ${O8}/>
    <rect x="166" y="148" width="262" height="16" rx="6" fill="#c98a4b" ${O}/>
    <rect x="166" y="236" width="262" height="18" rx="6" fill="#c98a4b" ${O}/>
    <path d="M186 70 Q240 60 290 66" fill="none" stroke="#fff8e8" stroke-width="8" stroke-linecap="round"/>`);
}

/** Where items sit on the hub's shelf (stage coords, centers), newest last. */
export const HUB_SHELF_SLOTS = [
  { x: 210, y: 118 },
  { x: 297, y: 118 },
  { x: 384, y: 118 },
  { x: 210, y: 206 },
  { x: 297, y: 206 },
  { x: 384, y: 206 },
];
