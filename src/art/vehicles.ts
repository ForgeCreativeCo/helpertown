import type { VehicleId } from '../content/vehicles';
import { fromMarkup, s } from '../core/svg';
import { DARK_METAL, INK, METAL } from './palette';

/**
 * The eight vehicles: rounded and toy-like, thick outlines, a friendly
 * headlight "eye" and a little smile. Each faces right and is drawn in a
 * 480×300 box with the ground at y≈296.
 */
export const VEHICLE_W = 480;
export const VEHICLE_H = 300;

type Pt = { x: number; y: number };

export interface VehicleAnchors {
  /** Front tire (wheeled vehicles only). */
  tire?: Pt;
  door: Pt;
  /** A big flat body panel (dents and scratches). */
  panel: Pt;
  /** On top (stuck branches). */
  roof: Pt;
  /** The headlight eye. */
  light: Pt;
  /** License plate, at the back. */
  plate: Pt;
}

export interface VehicleArt {
  /** Everything visible. Bounce and wiggle this. */
  body: SVGGElement;
  /** Wheel groups that spin while driving. */
  spinners: SVGGElement[];
  /** Outer group of the front wheel, for squashing (flat tire) or tilting (loose wheel). */
  frontWheel: SVGGElement | null;
  /** The headlight eye (hidden while a light is missing). */
  light: SVGGElement;
  /** The moving part used in the self-test once fixed. */
  part: SVGGElement;
  /** Plays the part's self-test motion. */
  testPart(): Animation;
  anchors: VehicleAnchors;
  /** Main paint color (for paint patches). */
  color: string;
}

const GLASS = '#bfe7f7';
const O8 = `stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;
const O6 = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;

/** Shared truck cab on the right of the box (x 320–464). */
function cab(color: string, trim: string): string {
  return `
    <path d="M320 214 V108 Q320 88 340 88 H398 Q418 88 428 106 L456 160 Q464 174 464 190 V214 Z" fill="${color}" ${O8}/>
    <path d="M338 106 H396 Q404 106 410 116 L432 158 H338 Z" fill="${GLASS}" ${O6}/>
    <path d="M344 114 L362 114" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <rect x="334" y="166" width="78" height="42" rx="6" fill="none" stroke="${trim}" stroke-width="5"/>
    <rect x="390" y="178" width="16" height="7" rx="3" fill="${trim}"/>
    <path d="M432 204 q10 8 22 0" fill="none" ${O6}/>`;
}

const CAB_ANCHORS = { door: { x: 372, y: 187 }, roof: { x: 372, y: 86 }, light: { x: 446, y: 182 } };

const CHASSIS = `
  <rect x="22" y="198" width="440" height="34" rx="10" fill="${DARK_METAL}" ${O8}/>
  <rect x="452" y="194" width="18" height="32" rx="6" fill="${METAL}" ${O6}/>`;

function tracks(x: number, w: number): string {
  return `
    <rect x="${x}" y="216" width="${w}" height="76" rx="38" fill="#333840" ${O8}/>
    <rect x="${x + 16}" y="230" width="${w - 32}" height="48" rx="24" fill="${DARK_METAL}"/>`;
}

function star(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.48;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

interface Spec {
  color: string;
  /** Markup and placeholders, back to front. */
  layers: (string | 'PART' | 'WHEELS')[];
  part: string;
  /** Transform origin of the part, as a fraction of its own box. */
  partOrigin: string;
  partMotion: Keyframe[];
  partDuration: number;
  wheels: { x: number; r?: number; road?: boolean }[];
  anchors: VehicleAnchors;
}

const WHEEL_Y = 250;

function wheel(cx: number, r: number, road: boolean): { outer: SVGGElement; spin: SVGGElement } {
  const cy = road ? 254 : WHEEL_Y;
  const bolts = [0, 90, 180, 270]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      return `<circle cx="${(cx + Math.cos(rad) * r * 0.27).toFixed(1)}" cy="${(cy + Math.sin(rad) * r * 0.27).toFixed(1)}" r="${road ? 2.5 : 4}" fill="${INK}"/>`;
    })
    .join('');
  const spin = fromMarkup(`
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#333840" stroke="${INK}" stroke-width="${road ? 6 : 8}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.48}" fill="${METAL}" stroke="${INK}" stroke-width="${road ? 4 : 5}"/>
    ${bolts}`);
  spin.setAttribute('class', 'tf');
  const outer = s('g', { class: 'tf-bottom' }, [spin]);
  return { outer, spin };
}

const PULSE: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.25)' },
  { transform: 'scale(1)' },
  { transform: 'scale(1.25)' },
  { transform: 'scale(1)' },
  { transform: 'scale(1.25)' },
  { transform: 'scale(1)' },
];

const SPECS: Record<VehicleId, Spec> = {
  dumpTruck: {
    color: '#f2b33d',
    layers: [CHASSIS, 'PART', cab('#f2b33d', '#c98a1e'), 'WHEELS'],
    part: `
      <path d="M38 198 L28 84 Q28 72 40 72 H300 Q312 72 312 84 L304 198 Z" fill="#f2b33d" ${O8}/>
      <rect x="40" y="82" width="260" height="10" rx="5" fill="#ffd982"/>
      <circle cx="40" cy="196" r="9" fill="${DARK_METAL}" ${O6}/>`,
    partOrigin: '5% 97%',
    partMotion: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-22deg)', offset: 0.4 }, { transform: 'rotate(-22deg)', offset: 0.6 }, { transform: 'rotate(0deg)' }],
    partDuration: 1600,
    wheels: [{ x: 110 }, { x: 380 }],
    anchors: { tire: { x: 380, y: WHEEL_Y }, panel: { x: 170, y: 140 }, plate: { x: 64, y: 168 }, ...CAB_ANCHORS },
  },
  excavator: {
    color: '#f07f2a',
    layers: [
      tracks(34, 370),
      'WHEELS',
      `<rect x="40" y="136" width="36" height="76" rx="10" fill="${DARK_METAL}" ${O6}/>
       <rect x="56" y="126" width="290" height="96" rx="16" fill="#f07f2a" ${O8}/>
       <rect x="62" y="198" width="278" height="10" fill="#b9561a"/>
       <path d="M216 128 V60 Q216 44 232 44 H300 Q318 44 322 62 L338 128 Z" fill="#f07f2a" ${O8}/>
       <path d="M232 60 H298 Q306 60 308 68 L318 104 H232 Z" fill="${GLASS}" ${O6}/>
       <path d="M306 194 q10 8 22 0" fill="none" ${O6}/>`,
      'PART',
    ],
    part: `
      <path d="M300 150 L392 52 L452 148" fill="none" stroke="${INK}" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M300 150 L392 52 L452 148" fill="none" stroke="#f07f2a" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="392" cy="52" r="9" fill="${DARK_METAL}" ${O6}/>
      <circle cx="300" cy="150" r="11" fill="${DARK_METAL}" ${O6}/>
      <path d="M432 140 L474 148 L470 196 Q444 204 428 182 Z" fill="${DARK_METAL}" ${O6}/>`,
    partOrigin: '8% 68%',
    partMotion: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(0deg)' }],
    partDuration: 1500,
    wheels: [76, 148, 220, 292, 364].map((x) => ({ x, r: 20, road: true })),
    anchors: { door: { x: 268, y: 116 }, panel: { x: 150, y: 168 }, roof: { x: 268, y: 44 }, light: { x: 330, y: 168 }, plate: { x: 58, y: 174 } },
  },
  bulldozer: {
    color: '#f5c518',
    layers: [
      tracks(26, 350),
      'WHEELS',
      `<rect x="58" y="128" width="282" height="96" rx="16" fill="#f5c518" ${O8}/>
       <path d="M300 146 V206 M316 146 V206" stroke="#c79a10" stroke-width="5" stroke-linecap="round"/>
       <path d="M88 130 V54 Q88 40 102 40 H222 Q236 40 236 54 V130 Z" fill="#f5c518" ${O8}/>
       <rect x="104" y="56" width="116" height="50" rx="8" fill="${GLASS}" ${O6}/>
       <rect x="270" y="78" width="16" height="52" rx="5" fill="${DARK_METAL}" ${O6}/>
       <path d="M300 200 L392 228" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
       <path d="M300 200 L392 228" stroke="${DARK_METAL}" stroke-width="10" stroke-linecap="round"/>
       <path d="M286 196 q10 8 22 0" fill="none" ${O6}/>`,
      'PART',
    ],
    part: `
      <path d="M386 112 Q426 200 386 290 H452 Q470 200 452 112 Z" fill="#e0b10e" ${O8}/>
      <rect x="384" y="280" width="72" height="12" rx="4" fill="${METAL}" ${O6}/>`,
    partOrigin: '50% 50%',
    partMotion: [{ transform: 'translateY(0px)' }, { transform: 'translateY(-34px)', offset: 0.4 }, { transform: 'translateY(-34px)', offset: 0.6 }, { transform: 'translateY(0px)' }],
    partDuration: 1400,
    wheels: [66, 136, 206, 276, 346].map((x) => ({ x, r: 20, road: true })),
    anchors: { door: { x: 162, y: 118 }, panel: { x: 170, y: 172 }, roof: { x: 162, y: 40 }, light: { x: 300, y: 164 }, plate: { x: 92, y: 178 } },
  },
  cementMixer: {
    color: '#3d7fe0',
    layers: [
      CHASSIS,
      `<rect x="70" y="168" width="22" height="34" fill="${DARK_METAL}" ${O6}/>
       <rect x="262" y="168" width="22" height="34" fill="${DARK_METAL}" ${O6}/>
       <path d="M16 70 L56 96 L56 128 L36 128 Z" fill="#3d7fe0" ${O6}/>`,
      'PART',
      cab('#3d7fe0', '#1e3f73'),
      'WHEELS',
    ],
    part: `
      <ellipse cx="176" cy="128" rx="142" ry="74" fill="#e9eef2"/>
      <path d="M100 78 L132 178 M170 66 L200 190 M240 80 L262 174" stroke="#3d7fe0" stroke-width="18" stroke-linecap="round"/>
      <path d="M70 100 Q120 66 190 62" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="176" cy="128" rx="142" ry="74" fill="none" stroke="${INK}" stroke-width="8"/>`,
    partOrigin: '50% 50%',
    partMotion: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(0deg)' }],
    partDuration: 1400,
    wheels: [{ x: 92 }, { x: 196 }, { x: 384 }],
    anchors: { tire: { x: 384, y: WHEEL_Y }, panel: { x: 176, y: 128 }, plate: { x: 32, y: 214 }, ...CAB_ANCHORS },
  },
  fireTruck: {
    color: '#e4473b',
    layers: [
      CHASSIS,
      `<rect x="22" y="98" width="300" height="106" rx="12" fill="#e4473b" ${O8}/>
       <rect x="44" y="116" width="118" height="66" rx="8" fill="#c9372d" stroke="${INK}" stroke-width="5"/>
       <rect x="180" y="116" width="124" height="66" rx="8" fill="#c9372d" stroke="${INK}" stroke-width="5"/>
       <rect x="96" y="144" width="16" height="7" rx="3" fill="${METAL}"/>
       <rect x="236" y="144" width="16" height="7" rx="3" fill="${METAL}"/>
       <rect x="26" y="188" width="292" height="9" fill="#fff3c4"/>
       <rect x="60" y="86" width="10" height="14" fill="${DARK_METAL}"/>
       <rect x="290" y="86" width="10" height="14" fill="${DARK_METAL}"/>
       <rect x="34" y="70" width="290" height="8" rx="3" fill="${METAL}" stroke="${INK}" stroke-width="5"/>
       <rect x="34" y="84" width="290" height="8" rx="3" fill="${METAL}" stroke="${INK}" stroke-width="5"/>
       <path d="${[54, 82, 110, 138, 166, 194, 222, 250, 278, 306].map((x) => `M${x} 76 V86`).join(' ')}" stroke="${INK}" stroke-width="5"/>`,
      cab('#e4473b', '#a82a20'),
      'PART',
      'WHEELS',
    ],
    part: `
      <rect x="346" y="84" width="48" height="8" rx="3" fill="${DARK_METAL}"/>
      <rect x="352" y="66" width="36" height="22" rx="9" fill="#ffcf3d" ${O6}/>`,
    partOrigin: '50% 80%',
    partMotion: PULSE,
    partDuration: 1500,
    wheels: [{ x: 92 }, { x: 172 }, { x: 384 }],
    anchors: { tire: { x: 384, y: WHEEL_Y }, panel: { x: 242, y: 149 }, door: CAB_ANCHORS.door, roof: { x: 180, y: 68 }, light: CAB_ANCHORS.light, plate: { x: 40, y: 168 } },
  },
  ambulance: {
    color: '#f4f4f4',
    layers: [
      CHASSIS,
      `<rect x="22" y="56" width="302" height="150" rx="14" fill="#f4f4f4"/>
       <rect x="22" y="150" width="302" height="22" fill="#e4473b"/>
       <rect x="22" y="56" width="302" height="150" rx="14" fill="none" ${O8}/>
       <path d="M236 128 C204 108 208 82 224 82 C231 82 236 88 236 94 C236 88 241 82 248 82 C264 82 268 108 236 128 Z" fill="#e4473b" ${O6}/>`,
      cab('#f4f4f4', '#9aa3ad'),
      'PART',
      'WHEELS',
    ],
    part: `
      <rect x="40" y="38" width="34" height="20" rx="8" fill="#e4473b" ${O6}/>
      <rect x="276" y="38" width="34" height="20" rx="8" fill="#4a90e2" ${O6}/>`,
    partOrigin: '50% 80%',
    partMotion: PULSE,
    partDuration: 1500,
    wheels: [{ x: 92 }, { x: 384 }],
    anchors: { tire: { x: 384, y: WHEEL_Y }, panel: { x: 104, y: 106 }, door: CAB_ANCHORS.door, roof: { x: 170, y: 54 }, light: CAB_ANCHORS.light, plate: { x: 58, y: 120 } },
  },
  policeCar: {
    color: '#2b4fa0',
    layers: [
      `<rect x="10" y="186" width="18" height="30" rx="6" fill="${METAL}" ${O6}/>
       <rect x="456" y="186" width="18" height="30" rx="6" fill="${METAL}" ${O6}/>
       <path d="M118 150 L160 92 Q166 84 178 84 H298 Q312 84 320 92 L372 150 Z" fill="#2b4fa0" ${O8}/>
       <path d="M172 98 H236 V142 H140 Z" fill="${GLASS}" ${O6}/>
       <path d="M250 98 H298 Q306 98 310 104 L340 142 H250 Z" fill="${GLASS}" ${O6}/>
       <rect x="18" y="144" width="450" height="92" rx="26" fill="#2b4fa0" ${O8}/>
       <rect x="150" y="152" width="196" height="66" rx="10" fill="#ffffff" stroke="${INK}" stroke-width="5"/>
       <path d="${star(196, 185, 17)}" fill="#f2b33d" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
       <rect x="300" y="174" width="18" height="7" rx="3" fill="#9aa3ad"/>
       <path d="M436 208 q10 8 22 0" fill="none" ${O6}/>`,
      'PART',
      'WHEELS',
    ],
    part: `
      <rect x="208" y="64" width="38" height="20" rx="7" fill="#e4473b" ${O6}/>
      <rect x="246" y="64" width="38" height="20" rx="7" fill="#4a90e2" ${O6}/>`,
    partOrigin: '50% 80%',
    partMotion: PULSE,
    partDuration: 1500,
    wheels: [
      { x: 110, r: 40 },
      { x: 370, r: 40 },
    ],
    anchors: { tire: { x: 370, y: WHEEL_Y }, door: { x: 322, y: 196 }, panel: { x: 252, y: 186 }, roof: { x: 246, y: 62 }, light: { x: 446, y: 176 }, plate: { x: 48, y: 192 } },
  },
  towTruck: {
    color: '#3fae5a',
    layers: [
      CHASSIS,
      `<path d="M110 160 L70 44" stroke="${INK}" stroke-width="28" stroke-linecap="round"/>
       <path d="M110 160 L70 44" stroke="${DARK_METAL}" stroke-width="15" stroke-linecap="round"/>`,
      'PART',
      `<circle cx="70" cy="44" r="11" fill="${METAL}" ${O6}/>
       <rect x="28" y="156" width="290" height="50" rx="8" fill="#3fae5a" ${O8}/>
       <rect x="32" y="170" width="282" height="10" fill="#f2b33d"/>
       <rect x="356" y="70" width="32" height="20" rx="8" fill="#ffb02e" ${O6}/>`,
      cab('#3fae5a', '#226b35'),
      'WHEELS',
    ],
    part: `
      <path d="M70 44 V118" stroke="${INK}" stroke-width="5"/>
      <path d="M70 116 q0 24 -16 24 q-12 0 -12 -12" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M70 116 q0 24 -16 24 q-12 0 -12 -12" fill="none" stroke="${METAL}" stroke-width="4" stroke-linecap="round"/>`,
    partOrigin: '88% 0%',
    partMotion: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(0deg)' }],
    partDuration: 1500,
    wheels: [{ x: 100 }, { x: 384 }],
    anchors: { tire: { x: 384, y: WHEEL_Y }, panel: { x: 200, y: 184 }, plate: { x: 46, y: 190 }, ...CAB_ANCHORS },
  },
};

/** A friendly headlight "eye", centered on the anchor. */
function eye(p: Pt): SVGGElement {
  const g = fromMarkup(`
    <circle cx="${p.x}" cy="${p.y}" r="17" fill="#fff6b0" ${O6}/>
    <circle cx="${p.x + 3}" cy="${p.y + 1}" r="7.5" fill="${INK}"/>
    <circle cx="${p.x + 6}" cy="${p.y - 2}" r="2.6" fill="#ffffff"/>`);
  g.setAttribute('class', 'tf');
  return g;
}

export function vehicleArt(id: VehicleId): VehicleArt {
  const spec = SPECS[id];
  const body = s('g', { class: 'tf-bottom' });
  const part = fromMarkup(spec.part);
  part.style.transformBox = 'fill-box';
  part.style.transformOrigin = spec.partOrigin;
  const spinners: SVGGElement[] = [];
  let frontWheel: SVGGElement | null = null;
  for (const layer of spec.layers) {
    if (layer === 'PART') body.append(part);
    else if (layer === 'WHEELS') {
      for (const w of spec.wheels) {
        const { outer, spin } = wheel(w.x, w.r ?? 42, !!w.road);
        body.append(outer);
        spinners.push(spin);
        if (!w.road && w.x === spec.anchors.tire?.x) frontWheel = outer;
      }
    } else body.append(fromMarkup(layer));
  }
  const light = eye(spec.anchors.light);
  body.append(light);
  return {
    body,
    spinners,
    frontWheel,
    light,
    part,
    testPart: () => part.animate(spec.partMotion, { duration: spec.partDuration, easing: 'ease-in-out' }),
    anchors: spec.anchors,
    color: spec.color,
  };
}

/** A license plate with his initial (the only words a child ever sees). */
export function addPlate(v: VehicleArt, letter: string): void {
  const p = v.anchors.plate;
  const plate = s('g', { class: 'no-hit' }, [
    s('rect', { x: p.x - 21, y: p.y - 14, width: 42, height: 28, rx: 5, fill: '#fffbe8', stroke: INK, 'stroke-width': 4 }),
  ]);
  const text = s('text', {
    x: p.x,
    y: p.y + 1,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-family': 'system-ui, sans-serif',
    'font-weight': 800,
    'font-size': 22,
    fill: INK,
  });
  text.textContent = letter.toUpperCase();
  plate.append(text);
  v.body.append(plate);
}
