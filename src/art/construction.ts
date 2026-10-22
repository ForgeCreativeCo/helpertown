import { getRock, type RockColor, type TileShape } from '../content/construction';
import { fromMarkup, s } from '../core/svg';
import { INK } from './palette';
import { vehicleArt, type VehicleArt } from './vehicles';

/** Construction Site art. Same style as everywhere: flat colors, thick outlines, no filters. */
const O = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const O8 = `stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;
export const CONSTRUCTION_BACKDROP = '#d9b37c';

/** The town building: a fenced lot with a crane and a half-built frame. 460×380 box, ground at 380. */
export function constructionBuilding(): SVGGElement {
  const fence: string[] = [];
  for (let x = 30; x <= 410; x += 38) fence.push(`<rect x="${x}" y="270" width="20" height="110" rx="4" fill="#f2b33d" stroke="${INK}" stroke-width="5"/>`);
  return fromMarkup(`
    <ellipse cx="230" cy="380" rx="230" ry="16" fill="#5e8f4e" opacity="0.6"/>
    <rect x="300" y="40" width="22" height="340" fill="#f5c518" ${O}/>
    <path d="M300 60 L322 90 M322 120 L300 150 M300 180 L322 210" stroke="${INK}" stroke-width="5"/>
    <rect x="120" y="30" width="320" height="22" rx="6" fill="#f5c518" ${O}/>
    <path d="M160 52 V130" stroke="${INK}" stroke-width="5"/>
    <rect x="140" y="130" width="40" height="30" rx="4" fill="#9aa3ad" ${O}/>
    <rect x="70" y="180" width="200" height="200" fill="none" stroke="#c96a2e" stroke-width="16"/>
    <path d="M70 280 H270 M170 180 V380" stroke="#c96a2e" stroke-width="12"/>
    <rect x="10" y="300" width="440" height="30" rx="8" fill="#f07f2a" ${O8}/>
    ${fence.join('')}
    <path d="M30 300 H430" stroke="${INK}" stroke-width="6"/>
    <path d="M380 380 L398 330 L416 380 Z" fill="#f07f2a" ${O}/>`);
}

/** The site: sky, a crane in the back, and packed dirt. */
export function siteBack(): SVGGElement {
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1400" fill="#a9dcf5"/>
    <circle cx="1180" cy="80" r="44" fill="#ffe27a" stroke="#f2b33d" stroke-width="8"/>
    <g opacity="0.55">
      <rect x="760" y="60" width="26" height="400" fill="#f5c518" stroke="${INK}" stroke-width="5"/>
      <rect x="560" y="50" width="420" height="24" rx="6" fill="#f5c518" stroke="${INK}" stroke-width="5"/>
      <path d="M600 74 V170" stroke="${INK}" stroke-width="5"/>
      <rect x="580" y="170" width="44" height="34" rx="4" fill="#9aa3ad" stroke="${INK}" stroke-width="5"/>
    </g>
    <path d="M-1280 470 Q-300 430 300 450 Q800 420 1300 450 Q2000 430 2560 470 V600 H-1280 Z" fill="#c99a63"/>
    <rect x="-1280" y="470" width="3840" height="1300" fill="#d9b37c"/>`);
}

/** A rock, centered on (0,0), about 120 across. */
export function rockArt(color: RockColor): SVGGElement {
  const r = getRock(color);
  return fromMarkup(`
    <path d="M-58 20 Q-66 -18 -30 -40 Q4 -60 36 -40 Q66 -22 58 14 Q52 44 10 46 Q-48 50 -58 20 Z" fill="${r.fill}" ${O}/>
    <path d="M-30 -22 Q-12 -38 10 -34" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.6"/>
    <path d="M20 20 Q36 14 40 -2" fill="none" stroke="${r.shade}" stroke-width="7" stroke-linecap="round"/>`);
}

/** The dump truck from the garage, painted one rock color (480×300 box like every vehicle). */
export function colorTruck(color: RockColor): VehicleArt {
  const v = vehicleArt('dumpTruck');
  const r = getRock(color);
  const paint: Record<string, string> = { '#f2b33d': r.fill, '#c98a1e': r.shade, '#ffd982': '#ffffff' };
  for (const el of v.body.querySelectorAll('[fill]')) {
    const to = paint[el.getAttribute('fill')!.toLowerCase()];
    if (to) el.setAttribute('fill', to);
  }
  return v;
}

/** Where a load sits in a dump truck's bed (truck coordinates). */
export const BED = { x: 170, y: 70 };

/** A heap of dirt, centered on (0,0) at its base. */
export function dirtPile(scale = 1): SVGGElement {
  return fromMarkup(`
    <g transform="scale(${scale})">
      <path d="M-170 0 Q-150 -90 -60 -120 Q0 -150 60 -118 Q150 -90 170 0 Z" fill="#a8743f" ${O8}/>
      <circle cx="-60" cy="-60" r="10" fill="#8a5a2f"/><circle cx="30" cy="-90" r="8" fill="#8a5a2f"/><circle cx="90" cy="-40" r="9" fill="#8a5a2f"/>
    </g>`);
}

/** One scoop of dirt, centered on (0,0). */
export function dirtScoop(): SVGGElement {
  return fromMarkup(`<path d="M-44 14 Q-40 -26 0 -30 Q40 -26 44 14 Z" fill="#a8743f" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`);
}

/** Sizes of each tile in its own coordinates (centered on 0,0). */
export const TILE_SIZE: Record<TileShape, { w: number; h: number }> = {
  square: { w: 120, h: 120 },
  triangle: { w: 130, h: 112 },
  rectangle: { w: 170, h: 80 },
  circle: { w: 120, h: 120 },
};

/** A see-through magnetic tile, centered on (0,0). */
export function tileArt(shape: TileShape, color: string): SVGGElement {
  const { w, h } = TILE_SIZE[shape];
  const fill = `fill="${color}" fill-opacity="0.5" stroke="${color}" stroke-width="10" stroke-linejoin="round"`;
  const outline = `fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"`;
  let d: string;
  if (shape === 'triangle') d = `M0 ${-h / 2} L${w / 2} ${h / 2} H${-w / 2} Z`;
  else if (shape === 'circle') d = `M${-w / 2} 0 A${w / 2} ${w / 2} 0 1 0 ${w / 2} 0 A${w / 2} ${w / 2} 0 1 0 ${-w / 2} 0 Z`;
  else d = `M${-w / 2} ${-h / 2} H${w / 2} V${h / 2} H${-w / 2} Z`;
  return s('g', {}, [s('path', { d, ...attrs(fill) }), s('path', { d, ...attrs(outline) }), fromMarkup(`<circle cx="${-w / 4}" cy="${-h / 6}" r="7" fill="#ffffff" opacity="0.7"/>`)]);
}

function attrs(markup: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of markup.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]!] = m[2]!;
  return out;
}

/** The workbench of tiles Pops stands behind in the site (opens the builder). Box x 440–840, y 470–720. */
export function tileTable(): SVGGElement {
  const tiles = [
    tileArt('square', '#e4473b'),
    tileArt('triangle', '#3d7fe0'),
    tileArt('circle', '#f5c518'),
  ];
  tiles[0]!.setAttribute('transform', 'translate(540 520) scale(0.62)');
  tiles[1]!.setAttribute('transform', 'translate(640 516) scale(0.62)');
  tiles[2]!.setAttribute('transform', 'translate(740 520) scale(0.62)');
  return s('g', {}, [
    fromMarkup(`
      <rect x="440" y="560" width="400" height="150" fill="#c98a4b" ${O8}/>
      <path d="M460 600 H820 M460 640 H820 M460 680 H820" stroke="#b9773d" stroke-width="5"/>
      <rect x="426" y="548" width="428" height="26" rx="8" fill="#a0612f" ${O8}/>`),
    ...tiles,
  ]);
}

/** A striped barrier in front of Pops at the left of the game screens. */
export function sideBarrier(): SVGGElement {
  const stripes: string[] = [];
  for (let x = -80; x < 240; x += 60) stripes.push(`<path d="M${x} 600 L${x + 30} 600 L${x + 60} 660 L${x + 30} 660 Z" fill="#ffffff"/>`);
  return fromMarkup(`
    <rect x="-80" y="600" width="380" height="60" fill="#f07f2a"/>
    ${stripes.join('')}
    <rect x="-80" y="600" width="380" height="60" fill="none" ${O8}/>
    <rect x="-40" y="660" width="20" height="60" fill="#6b7480" ${O}/><rect x="240" y="660" width="20" height="60" fill="#6b7480" ${O}/>
    <rect x="-80" y="560" width="380" height="40" fill="#d9b37c"/>
    <path d="M-80 560 Q100 520 300 560 V600 H-80 Z" fill="#c99a63" ${O}/>`);
}
