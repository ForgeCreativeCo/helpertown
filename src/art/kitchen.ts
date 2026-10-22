import type { IngredientId } from '../content/ingredients';
import type { MagnetId } from '../content/magnets';
import { fromMarkup } from '../core/svg';
import { INK } from './palette';

/**
 * Mama's Kitchen: mint walls, a sunny window with curtains, a butcher-block
 * counter and a big friendly fridge. Same style as the workshop: flat colors,
 * thick dark outlines, no filters.
 */
const WALL = '#cdeadf';
const CABINET = '#8fcfbd';
export const KITCHEN_BACKDROP = '#7fbfae';

const O = `stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;
const O5 = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

function tiles(y1: number, y2: number): string {
  const out: string[] = [];
  for (let y = y1; y < y2; y += 40) out.push(`<line x1="-1280" y1="${y}" x2="2560" y2="${y}" stroke="#b9ddd0" stroke-width="3"/>`);
  for (let x = -1280; x < 2560; x += 40) out.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#b9ddd0" stroke-width="3"/>`);
  return out.join('');
}

function kitchenWindow(): string {
  return `
    <rect x="470" y="70" width="300" height="220" rx="14" fill="#a9dcf5" stroke="${INK}" stroke-width="10"/>
    <circle cx="700" cy="120" r="28" fill="#ffe27a"/>
    <path d="M480 250 q60 -36 120 -8 q60 -28 120 0 q30 -6 40 10 v28 h-280z" fill="#7cc46b"/>
    <line x1="620" y1="70" x2="620" y2="290" stroke="${INK}" stroke-width="8"/>
    <path d="M462 64 H778" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M466 70 Q500 160 480 300 H462 Z" fill="#e85fa4" ${O5}/>
    <path d="M774 70 Q740 160 760 300 H778 Z" fill="#e85fa4" ${O5}/>
    <rect x="456" y="288" width="328" height="20" rx="8" fill="#fff8e8" ${O}/>`;
}

/** The kitchen room for the hub (counter drawn separately, in front of Mama). */
export function kitchenBack(): SVGGElement {
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1400" fill="${WALL}"/>
    ${tiles(380, 520)}
    <rect x="-1280" y="-800" width="3840" height="110" fill="#b5ddd0"/>
    ${kitchenWindow()}
    <!-- A little plant on the sill -->
    <rect x="590" y="262" width="34" height="28" rx="6" fill="#d9534f" ${O5}/>
    <rect x="-1280" y="600" width="3840" height="1000" fill="#d9c7a8"/>
    <path d="M-1280 650 H2560 M-1280 720 H2560" stroke="#c7b391" stroke-width="5"/>
  `);
}

/** The plant's leaves on the sill (sways gently). */
export function plant(): SVGGElement {
  return fromMarkup(`
    <path d="M607 264 Q590 230 600 214 Q612 236 607 264 Z M607 264 Q628 228 642 226 Q630 250 607 264 Z M607 264 Q604 236 614 206" fill="#3fae5a" ${O5}/>`);
}

/** The counter in front of Mama, with lower cabinets. */
export function kitchenCounter(x1 = -1280, x2 = 960): SVGGElement {
  const doors: string[] = [];
  for (let x = Math.max(x1, -1280) + 30; x < x2 - 140; x += 220) {
    doors.push(`<rect x="${x}" y="584" width="190" height="150" rx="10" fill="${CABINET}" stroke="${INK}" stroke-width="6"/>`);
    doors.push(`<rect x="${x + 70}" y="600" width="50" height="14" rx="7" fill="#f2b33d" stroke="${INK}" stroke-width="4"/>`);
  }
  return fromMarkup(`
    <rect x="${x1}" y="560" width="${x2 - x1}" height="1100" fill="#6fb8a4" ${O}/>
    ${doors.join('')}
    <rect x="${x1}" y="516" width="${x2 - x1}" height="50" rx="10" fill="#d9a066" ${O}/>
    <rect x="${x1}" y="526" width="${x2 - x1}" height="10" fill="#ecc08a"/>
  `);
}

/** The fridge on the right of the hub. Magnets go on the lower door. */
export function fridge(): SVGGElement {
  return fromMarkup(`
    <ellipse cx="1105" cy="704" rx="140" ry="14" fill="#9b8b6e" opacity="0.5"/>
    <rect x="980" y="120" width="250" height="580" rx="28" fill="#dcecf7" ${O}/>
    <path d="M980 296 H1230" stroke="${INK}" stroke-width="8"/>
    <rect x="1000" y="150" width="20" height="110" rx="10" fill="#9aa3ad" stroke="${INK}" stroke-width="5"/>
    <rect x="1000" y="320" width="20" height="160" rx="10" fill="#9aa3ad" stroke="${INK}" stroke-width="5"/>
    <path d="M1200 140 Q1214 160 1210 200" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  `);
}

/** Where fridge magnets sit (stage coords), filled in this order. */
export const MAGNET_SLOTS = [
  { x: 1074, y: 400 },
  { x: 1170, y: 410 },
  { x: 1080, y: 520 },
  { x: 1166, y: 600 },
];

/** A teapot on the counter, with steam wisps the hub animates. */
export function teapot(): { pot: SVGGElement; steam: SVGGElement[] } {
  const pot = fromMarkup(`
    <path d="M846 470 Q880 464 884 440" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <path d="M846 470 Q880 464 884 440" fill="none" stroke="#e85fa4" stroke-width="5" stroke-linecap="round"/>
    <path d="M770 520 Q760 460 812 452 Q864 460 854 520 Z" fill="#e85fa4" ${O}/>
    <path d="M790 452 Q812 430 834 452" fill="#e85fa4" ${O5}/>
    <circle cx="812" cy="434" r="7" fill="#f2b33d" stroke="${INK}" stroke-width="4"/>
    <path d="M768 478 Q742 482 750 504" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`);
  const steam = [880, 896].map((x) => fromMarkup(`<path d="M${x} 430 q-8 -12 0 -24 q8 -12 0 -24" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.85"/>`));
  return { pot, steam };
}

/** A mixing bowl centered on (cx, cy): cooking, baking, and the hub counter. */
export function mixingBowl(cx: number, cy: number): SVGGElement {
  return fromMarkup(`
    <path d="M${cx - 92} ${cy - 30} H${cx + 92} Q${cx + 84} ${cy + 40} ${cx} ${cy + 44} Q${cx - 84} ${cy + 40} ${cx - 92} ${cy - 30} Z" fill="#7fb4ef" ${O}/>
    <ellipse cx="${cx}" cy="${cy - 30}" rx="92" ry="16" fill="#f6efe2" ${O}/>
    <path d="M${cx - 66} ${cy - 6} Q${cx - 40} ${cy + 22} ${cx - 6} ${cy + 26}" fill="none" stroke="#b9d6f7" stroke-width="8" stroke-linecap="round"/>`);
}

/** A window shade for the wind-down (animate scaleY 0 → 1 from the top). */
export function windowShade(): SVGGElement {
  const g = fromMarkup(`<rect x="476" y="74" width="288" height="212" fill="#f0e2c4"/><path d="M476 280 H764" stroke="${INK}" stroke-width="6"/>`);
  g.style.transformBox = 'fill-box';
  g.style.transformOrigin = '50% 0%';
  g.style.transform = 'scaleY(0)';
  return g;
}

/** The close-up counter for the cooking games: wall and window behind. */
export function cookBack(): SVGGElement {
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1400" fill="${WALL}"/>
    ${tiles(330, 520)}
    <rect x="-1280" y="-800" width="3840" height="110" fill="#b5ddd0"/>
    <rect x="760" y="40" width="300" height="200" rx="14" fill="#a9dcf5" stroke="${INK}" stroke-width="10"/>
    <circle cx="990" cy="90" r="26" fill="#ffe27a"/>
    <line x1="910" y1="40" x2="910" y2="240" stroke="${INK}" stroke-width="8"/>
    <path d="M756 36 Q790 130 770 246 H752 Z M1064 36 Q1030 130 1050 246 H1068 Z" fill="#e85fa4" ${O5}/>
    <rect x="-1280" y="600" width="3840" height="1000" fill="#d9c7a8"/>
  `);
}

/** Ingredients, each drawn in a 160×160 box (center 80,80), one strong color each. */
const INGREDIENT_ART: Record<IngredientId, string> = {
  egg: `
    <ellipse cx="62" cy="92" rx="36" ry="46" fill="#f6efe2" ${O}/>
    <ellipse cx="104" cy="98" rx="34" ry="44" fill="#fffaf0" ${O}/>
    <ellipse cx="50" cy="72" rx="8" ry="14" fill="#ffffff"/>
    <ellipse cx="94" cy="80" rx="8" ry="13" fill="#ffffff"/>`,
  banana: `
    <path d="M28 52 Q30 130 108 136 Q140 136 142 124 Q90 120 64 90 Q46 68 48 44 Z" fill="#f5d33d" ${O}/>
    <path d="M58 70 Q70 110 116 124" fill="none" stroke="#e0b10e" stroke-width="6" stroke-linecap="round"/>
    <path d="M26 54 L40 34 L52 42 Z" fill="#8a5a35" ${O5}/>
    <circle cx="140" cy="126" r="5" fill="${INK}"/>`,
  milk: `
    <path d="M46 52 L80 18 L114 52 Z" fill="#3d7fe0" ${O}/>
    <rect x="46" y="52" width="68" height="96" rx="6" fill="#ffffff" ${O}/>
    <rect x="46" y="100" width="68" height="24" fill="#7fb4ef"/>
    <rect x="46" y="52" width="68" height="96" rx="6" fill="none" ${O}/>
    <path d="M80 66 Q68 84 80 92 Q92 84 80 66 Z" fill="#7fb4ef" ${O5}/>
    <rect x="70" y="10" width="20" height="14" rx="3" fill="#3d7fe0" ${O5}/>`,
  strawberry: `
    <path d="M80 148 Q30 112 34 70 Q38 44 80 48 Q122 44 126 70 Q130 112 80 148 Z" fill="#e4473b" ${O}/>
    <path d="M52 50 L64 30 L80 44 L96 30 L108 50 Q80 62 52 50 Z" fill="#3fae5a" ${O5}/>
    <rect x="76" y="14" width="8" height="22" rx="4" fill="#3fae5a" ${O5}/>
    <g fill="#ffe27a"><ellipse cx="60" cy="80" rx="3" ry="5"/><ellipse cx="82" cy="76" rx="3" ry="5"/><ellipse cx="104" cy="82" rx="3" ry="5"/><ellipse cx="70" cy="104" rx="3" ry="5"/><ellipse cx="94" cy="106" rx="3" ry="5"/><ellipse cx="82" cy="128" rx="3" ry="5"/></g>`,
  flour: `
    <path d="M36 56 Q36 40 54 36 H106 Q124 40 124 56 L130 140 Q130 150 118 150 H42 Q30 150 30 140 Z" fill="#efe2c4" ${O}/>
    <path d="M54 36 Q80 22 106 36 L100 18 Q80 28 60 18 Z" fill="#efe2c4" ${O5}/>
    <rect x="56" y="30" width="48" height="10" rx="5" fill="#d9534f" ${O5}/>
    <path d="M80 128 V72 M80 84 Q66 78 64 66 Q76 70 80 84 M80 84 Q94 78 96 66 Q84 70 80 84 M80 104 Q66 98 64 86 Q76 90 80 104 M80 104 Q94 98 96 86 Q84 90 80 104" fill="#e0b10e" ${O5}/>`,
  butter: `
    <path d="M20 112 L56 76 H148 L112 112 Z" fill="#7fb4ef" ${O}/>
    <rect x="20" y="112" width="92" height="30" fill="#5f97dc" ${O}/>
    <path d="M112 112 L148 76 V106 L112 142 Z" fill="#4a7fc4" ${O}/>
    <path d="M40 104 L64 80 H130 L106 104 Z" fill="#f7d774" ${O5}/>
    <path d="M40 104 V86 L64 62 H130 V80 M64 62 V80 M130 62 L106 86 V104" fill="#f7d774" ${O5}/>
    <path d="M40 86 L64 62 H130 L106 86 Z" fill="#fbe7a0" ${O5}/>`,
  blueberry: `
    <path d="M18 92 H142 Q136 146 80 148 Q24 146 18 92 Z" fill="#fff8e8" ${O}/>
    <g stroke="${INK}" stroke-width="5">
      <circle cx="44" cy="86" r="17" fill="#4a5fc1"/><circle cx="76" cy="82" r="18" fill="#3c4fa8"/><circle cx="110" cy="86" r="17" fill="#4a5fc1"/>
      <circle cx="60" cy="60" r="17" fill="#5a6fd1"/><circle cx="94" cy="58" r="17" fill="#4a5fc1"/><circle cx="78" cy="36" r="16" fill="#3c4fa8"/>
    </g>
    <path d="M42 80 l4 4 M74 76 l4 4 M108 80 l4 4 M58 54 l4 4 M92 52 l4 4" stroke="#c8d1ff" stroke-width="4" stroke-linecap="round"/>`,
  sugar: `
    <path d="M28 82 H132 Q128 148 80 148 Q32 148 28 82 Z" fill="#e85fa4" ${O}/>
    <ellipse cx="80" cy="82" rx="52" ry="14" fill="#ffffff" ${O5}/>
    <g stroke="${INK}" stroke-width="5" stroke-linejoin="round">
      <rect x="46" y="44" width="30" height="30" rx="4" fill="#ffffff" transform="rotate(-10 61 59)"/>
      <rect x="82" y="40" width="30" height="30" rx="4" fill="#ffffff" transform="rotate(12 97 55)"/>
      <rect x="64" y="20" width="30" height="30" rx="4" fill="#ffffff"/>
    </g>
    <path d="M52 108 Q60 128 80 132" fill="none" stroke="#f7a8cf" stroke-width="7" stroke-linecap="round"/>`,
};

export function ingredientArt(id: IngredientId): SVGGElement {
  return fromMarkup(INGREDIENT_ART[id]);
}

/** Fridge magnets, each drawn in a 100×100 box (center 50,50). */
const MAGNET_ART: Record<MagnetId, string> = {
  strawberry: `
    <path d="M50 92 Q14 66 18 40 Q22 22 50 26 Q78 22 82 40 Q86 66 50 92 Z" fill="#e4473b" ${O5}/>
    <path d="M32 28 L40 14 L50 24 L60 14 L68 28 Q50 36 32 28 Z" fill="#3fae5a" ${O5}/>
    <g fill="#ffe27a"><circle cx="38" cy="48" r="3"/><circle cx="56" cy="44" r="3"/><circle cx="64" cy="58" r="3"/><circle cx="46" cy="66" r="3"/></g>`,
  cupcake: `
    <path d="M24 56 H76 L68 92 H32 Z" fill="#7fb4ef" ${O5}/>
    <path d="M36 58 L40 90 M50 58 V90 M64 58 L60 90" stroke="#4a7fc4" stroke-width="4"/>
    <path d="M20 58 Q14 40 34 36 Q38 18 56 22 Q76 22 74 38 Q90 44 80 58 Z" fill="#f7a8cf" ${O5}/>
    <circle cx="52" cy="16" r="8" fill="#e4473b" ${O5}/>`,
  heart: `<path d="M50 88 C10 62 12 22 34 22 C43 22 50 30 50 36 C50 30 57 22 66 22 C88 22 90 62 50 88 Z" fill="#e85fa4" ${O5}/>
    <path d="M28 36 Q30 30 36 30" fill="none" stroke="#fbd0e6" stroke-width="5" stroke-linecap="round"/>`,
  banana: `<path d="M18 30 Q20 84 70 88 Q90 88 92 80 Q58 76 42 56 Q30 42 32 26 Z" fill="#f5d33d" ${O5}/>
    <path d="M16 32 L26 18 L34 24 Z" fill="#8a5a35" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  star: `<path d="M50 10 L61 37 L90 39 L67 57 L75 86 L50 70 L25 86 L33 57 L10 39 L39 37 Z" fill="#ffd34d" ${O5}/>`,
  carrot: `<path d="M30 30 L76 50 Q60 82 26 90 Q20 60 30 30 Z" fill="#f07f2a" ${O5}/>
    <path d="M30 30 Q20 12 34 10 Q38 22 42 26 Q48 12 58 18 Q48 26 46 34 Z" fill="#3fae5a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M38 48 L48 52 M34 64 L44 68" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  flower: `
    <g fill="#f7a8cf" stroke="${INK}" stroke-width="5"><circle cx="50" cy="24" r="16"/><circle cx="76" cy="44" r="16"/><circle cx="66" cy="74" r="16"/><circle cx="34" cy="74" r="16"/><circle cx="24" cy="44" r="16"/></g>
    <circle cx="50" cy="52" r="14" fill="#ffd34d" ${O5}/>`,
  apple: `
    <path d="M50 30 Q30 18 20 38 Q10 66 34 86 Q44 92 50 86 Q56 92 66 86 Q90 66 80 38 Q70 18 50 30 Z" fill="#e4473b" ${O5}/>
    <path d="M50 30 Q50 18 56 10" fill="none" stroke="#8a5a35" stroke-width="6" stroke-linecap="round"/>
    <path d="M56 20 Q70 10 76 18 Q66 28 56 20 Z" fill="#3fae5a" stroke="${INK}" stroke-width="4"/>
    <path d="M30 46 Q32 38 38 36" fill="none" stroke="#ff8a7d" stroke-width="5" stroke-linecap="round"/>`,
};

export function magnetArt(id: MagnetId): SVGGElement {
  return fromMarkup(MAGNET_ART[id]);
}
