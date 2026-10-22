import { fromMarkup } from '../core/svg';
import { DARK_METAL, FLOOR, INK, WALL } from './palette';

export { FLOOR, INK, WALL };

/**
 * Pops' Workshop scenery. All original art: flat colors, thick dark outlines,
 * baked-in shading, no filters. Coordinates are logical stage units (1280×800);
 * backgrounds reach far past the stage so letterbox areas show scenery.
 */

function planks(): string {
  const out: string[] = [];
  for (let x = -1280; x < 2560; x += 96) {
    out.push(`<line x1="${x}" y1="-800" x2="${x}" y2="600" stroke="#b97a42" stroke-width="5"/>`);
  }
  return out.join('');
}

function floor(): string {
  const boards: string[] = [];
  for (let y = 650; y < 1600; y += 70) {
    boards.push(`<line x1="-1280" y1="${y}" x2="2560" y2="${y}" stroke="#76492a" stroke-width="5"/>`);
  }
  return `
    <rect x="-1280" y="600" width="3840" height="1000" fill="${FLOOR}"/>
    ${boards.join('')}
    <rect x="-1280" y="590" width="3840" height="22" fill="#6b4024"/>`;
}

export function workshopBackground(): SVGGElement {
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1400" fill="${WALL}"/>
    ${planks()}
    <rect x="-1280" y="-800" width="3840" height="120" fill="#c4854c" opacity="0.6"/>

    <!-- Window with a sunny sky -->
    <rect x="440" y="60" width="300" height="190" rx="14" fill="#9fd8f5" stroke="${INK}" stroke-width="10"/>
    <circle cx="680" cy="110" r="30" fill="#ffe27a"/>
    <path d="M450 220 q60 -40 120 -10 q50 -30 110 0 q30 -10 50 10 v20 h-280z" fill="#7cc46b"/>
    <line x1="590" y1="60" x2="590" y2="250" stroke="${INK}" stroke-width="8"/>
    <line x1="440" y1="155" x2="740" y2="155" stroke="${INK}" stroke-width="8"/>
    <rect x="428" y="246" width="324" height="20" rx="8" fill="#a8703a" stroke="${INK}" stroke-width="8"/>

    <!-- Shelf for the radio and the cat -->
    <rect x="770" y="330" width="190" height="18" rx="6" fill="#a8703a" stroke="${INK}" stroke-width="8"/>
    <path d="M790 348 l14 26 M940 348 l-14 26" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>

    ${floor()}
    <ellipse cx="640" cy="760" rx="700" ry="60" fill="#7a4d2c" opacity="0.5"/>
  `);
}

export function workbench(): SVGGElement {
  return fromMarkup(`
    <rect x="430" y="560" width="22" height="130" fill="#7a4a26" stroke="${INK}" stroke-width="7"/>
    <rect x="668" y="560" width="22" height="130" fill="#7a4a26" stroke="${INK}" stroke-width="7"/>
    <rect x="436" y="620" width="248" height="16" fill="#7a4a26" stroke="${INK}" stroke-width="6"/>
    <rect x="410" y="520" width="300" height="46" rx="10" fill="#b8763d" stroke="${INK}" stroke-width="9"/>
    <rect x="422" y="528" width="276" height="10" rx="5" fill="#d9995a"/>
  `);
}

/** Pops' coffee mug; `steam` wisps are animated by the hub. */
export function coffeeMug(): { mug: SVGGElement; steam: SVGGElement[] } {
  const mug = fromMarkup(`
    <path d="M688 492 q22 0 22 14 q0 14 -22 14" fill="none" stroke="${INK}" stroke-width="8"/>
    <rect x="652" y="482" width="40" height="42" rx="8" fill="#3d7fe0" stroke="${INK}" stroke-width="8"/>
    <rect x="660" y="492" width="8" height="22" rx="4" fill="#8fb8f5"/>
  `);
  const steam = [662, 680].map((x) =>
    fromMarkup(`<path d="M${x} 474 q-8 -12 0 -24 q8 -12 0 -24" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.8"/>`),
  );
  return { mug, steam };
}

/** A small radio on the shelf; `notes` float up from it. */
export function radio(): { radio: SVGGElement; notes: SVGGElement[] } {
  const r = fromMarkup(`
    <path d="M800 272 L780 228" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="780" cy="226" r="6" fill="#e4473b" stroke="${INK}" stroke-width="4"/>
    <rect x="782" y="268" width="92" height="62" rx="12" fill="#3fae5a" stroke="${INK}" stroke-width="8"/>
    <circle cx="810" cy="300" r="17" fill="${DARK_METAL}" stroke="${INK}" stroke-width="6"/>
    <circle cx="810" cy="300" r="6" fill="#9aa3ad"/>
    <rect x="836" y="284" width="28" height="12" rx="4" fill="#fff3c4" stroke="${INK}" stroke-width="4"/>
    <circle cx="850" cy="314" r="7" fill="#f2b33d" stroke="${INK}" stroke-width="4"/>
  `);
  const notes = [0, 1].map((i) =>
    fromMarkup(
      `<g transform="translate(${860 + i * 20} ${250 - i * 10})"><ellipse cx="0" cy="0" rx="8" ry="6" fill="${INK}"/><path d="M7 -2 V-26 l10 6" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`,
    ),
  );
  return { radio: r, notes };
}

/** A cat asleep on the shelf; `body` breathes. */
export function sleepingCat(): { cat: SVGGElement; body: SVGGElement } {
  const body = fromMarkup(`
    <path d="M890 330 Q884 292 914 290 Q944 290 948 330 Z" fill="#f0a35a" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M902 300 q10 -6 18 2" fill="none" stroke="#c97a35" stroke-width="5" stroke-linecap="round"/>
  `);
  body.setAttribute('class', 'tf-bottom');
  const cat = fromMarkup(`
    <path d="M944 326 Q966 330 962 312" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M944 326 Q966 330 962 312" fill="none" stroke="#f0a35a" stroke-width="6" stroke-linecap="round"/>
  `);
  cat.append(body);
  cat.append(
    fromMarkup(`
      <path d="M876 330 Q866 302 882 296 L878 282 L892 292 L904 284 L904 300 Q914 314 904 330 Z" fill="#f0a35a" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M880 312 q5 4 10 0 M894 312 q5 4 10 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="892" cy="320" r="3" fill="#e2706a"/>
    `),
  );
  return { cat, body };
}

/** Where the toolbox's stickers sit (stage coords, left to right). */
export const TOOLBOX_STICKER_SLOTS = [
  { x: 152, y: 636 },
  { x: 208, y: 636 },
  { x: 264, y: 636 },
  { x: 320, y: 636 },
];

export function toolbox(): SVGGElement {
  return fromMarkup(`
    <ellipse cx="235" cy="690" rx="150" ry="14" fill="#5e3a20" opacity="0.5"/>
    <g transform="translate(100 690) scale(1.15) translate(-100 -690)">
      <path d="M160 548 v-30 a14 14 0 0 1 14 -14 h82 a14 14 0 0 1 14 14 v30" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
      <path d="M160 548 v-30 a14 14 0 0 1 14 -14 h82 a14 14 0 0 1 14 14 v30" fill="none" stroke="#9aa3ad" stroke-width="7" stroke-linecap="round"/>
      <rect x="100" y="545" width="230" height="140" rx="16" fill="#e4473b" stroke="${INK}" stroke-width="10"/>
      <rect x="100" y="545" width="230" height="44" rx="14" fill="#c9372d" stroke="${INK}" stroke-width="10"/>
      <rect x="114" y="553" width="140" height="10" rx="5" fill="#ff7a6d"/>
      <rect x="195" y="578" width="40" height="26" rx="6" fill="#f2b33d" stroke="${INK}" stroke-width="7"/>
    </g>
  `);
}

export function pegboard(): SVGGElement {
  const holes: string[] = [];
  for (let y = 120; y <= 310; y += 32) {
    for (let x = 95; x <= 370; x += 32) holes.push(`<circle cx="${x}" cy="${y}" r="5" fill="#a77b4c"/>`);
  }
  return fromMarkup(`
    <rect x="70" y="95" width="320" height="235" rx="12" fill="#e6c48f" stroke="${INK}" stroke-width="10"/>
    ${holes.join('')}
    <g stroke="${INK}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
      <rect x="120" y="150" width="20" height="120" rx="8" fill="#a0612f"/>
      <rect x="95" y="135" width="70" height="36" rx="10" fill="#e4473b"/>
      <rect x="230" y="168" width="22" height="104" rx="9" fill="#3d7fe0"/>
      <path d="M229 128 L229 150 L253 150 L253 128 A30 30 0 1 1 229 128 Z" fill="#3d7fe0"/>
      <rect x="318" y="140" width="34" height="62" rx="12" fill="#f2b33d"/>
      <rect x="329" y="200" width="12" height="80" rx="4" fill="#cfd6dd"/>
    </g>
  `);
}

export function carLift(): SVGGElement {
  return fromMarkup(`
    <g transform="translate(25 0)">
    <ellipse cx="820" cy="692" rx="150" ry="14" fill="#5e3a20" opacity="0.5"/>
    <rect x="690" y="420" width="26" height="270" rx="6" fill="#f2b33d" stroke="${INK}" stroke-width="8"/>
    <rect x="924" y="420" width="26" height="270" rx="6" fill="#f2b33d" stroke="${INK}" stroke-width="8"/>
    <rect x="680" y="410" width="46" height="24" rx="6" fill="${DARK_METAL}" stroke="${INK}" stroke-width="7"/>
    <rect x="914" y="410" width="46" height="24" rx="6" fill="${DARK_METAL}" stroke="${INK}" stroke-width="7"/>
    <path d="M735 560 v-40 a20 20 0 0 1 20 -20 h30 l30 -40 h60 a20 20 0 0 1 18 12 l20 48 a20 20 0 0 1 20 20 v20z" fill="#3fae5a" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
    <path d="M800 498 l22 -30 h44 l14 30z" fill="#bfe7f7" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="935" cy="530" r="11" fill="#fff6b0" stroke="${INK}" stroke-width="5"/>
    <circle cx="780" cy="566" r="26" fill="#333840" stroke="${INK}" stroke-width="8"/>
    <circle cx="780" cy="566" r="9" fill="#cfd6dd"/>
    <circle cx="900" cy="566" r="26" fill="#333840" stroke="${INK}" stroke-width="8"/>
    <circle cx="900" cy="566" r="9" fill="#cfd6dd"/>
    <rect x="700" y="590" width="240" height="22" rx="8" fill="#9aa3ad" stroke="${INK}" stroke-width="8"/>
    </g>
  `);
}

export function garageDoor(): SVGGElement {
  const slats: string[] = [];
  for (let y = 215; y + 50 <= 680; y += 58) {
    slats.push(`<rect x="1000" y="${y}" width="210" height="50" rx="6" fill="#e9eef2" stroke="${INK}" stroke-width="5"/>`);
  }
  return fromMarkup(`
    <g transform="translate(12 0)">
    <rect x="975" y="160" width="260" height="535" rx="14" fill="#6b7480" stroke="${INK}" stroke-width="10"/>
    <rect x="995" y="180" width="220" height="510" fill="#c9d1d8"/>
    ${slats.join('')}
    <rect x="1000" y="215" width="210" height="50" rx="6" fill="#bfe7f7" stroke="${INK}" stroke-width="5"/>
    <line x1="1070" y1="215" x2="1070" y2="265" stroke="${INK}" stroke-width="5"/>
    <line x1="1140" y1="215" x2="1140" y2="265" stroke="${INK}" stroke-width="5"/>
    <rect x="1080" y="620" width="50" height="16" rx="8" fill="${DARK_METAL}" stroke="${INK}" stroke-width="5"/>
    </g>
  `);
}

/** The close-up bench for Fetch the Tool: wall behind, a long bench in front. */
export function benchScene(): { back: SVGGElement; bench: SVGGElement } {
  const back = fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1400" fill="${WALL}"/>
    ${planks()}
    <rect x="-1280" y="-800" width="3840" height="120" fill="#c4854c" opacity="0.6"/>
    <!-- A lamp hanging over the bench -->
    <line x1="840" y1="-800" x2="840" y2="70" stroke="${INK}" stroke-width="6"/>
    <path d="M790 120 Q790 70 840 70 Q890 70 890 120 Z" fill="#3fae5a" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    <ellipse cx="840" cy="124" rx="22" ry="8" fill="#fff3a0" stroke="${INK}" stroke-width="5"/>
    <!-- Shelf with jars of screws -->
    <rect x="980" y="230" width="250" height="18" rx="6" fill="#a8703a" stroke="${INK}" stroke-width="8"/>
    <rect x="1000" y="176" width="50" height="56" rx="10" fill="#bfe7f7" stroke="${INK}" stroke-width="7"/>
    <rect x="1000" y="166" width="50" height="16" rx="5" fill="#e4473b" stroke="${INK}" stroke-width="6"/>
    <rect x="1070" y="186" width="44" height="46" rx="10" fill="#bfe7f7" stroke="${INK}" stroke-width="7"/>
    <rect x="1070" y="176" width="44" height="14" rx="5" fill="#3d7fe0" stroke="${INK}" stroke-width="6"/>
    <rect x="1136" y="170" width="54" height="62" rx="10" fill="#bfe7f7" stroke="${INK}" stroke-width="7"/>
    <rect x="1136" y="160" width="54" height="16" rx="5" fill="#f2b33d" stroke="${INK}" stroke-width="6"/>
    <circle cx="1018" cy="212" r="5" fill="#9aa3ad"/><circle cx="1032" cy="220" r="5" fill="#9aa3ad"/>
    <circle cx="1090" cy="216" r="5" fill="#9aa3ad"/><circle cx="1160" cy="206" r="5" fill="#9aa3ad"/>
    ${floor()}
  `);
  const drawers: string[] = [];
  for (let x = -1200; x < 2500; x += 240) {
    drawers.push(
      `<rect x="${x}" y="620" width="210" height="110" rx="10" fill="#a8693a" stroke="${INK}" stroke-width="7"/>` +
        `<rect x="${x + 80}" y="664" width="50" height="16" rx="8" fill="#e6c48f" stroke="${INK}" stroke-width="5"/>`,
    );
  }
  const bench = fromMarkup(`
    <rect x="-1280" y="580" width="3840" height="1100" fill="#b8763d" stroke="${INK}" stroke-width="9"/>
    ${drawers.join('')}
    <rect x="-1280" y="548" width="3840" height="44" fill="#c98446" stroke="${INK}" stroke-width="9"/>
    <rect x="-1280" y="556" width="3840" height="9" fill="#e0a466"/>
  `);
  return { back, bench };
}
