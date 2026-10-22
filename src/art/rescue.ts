import type { EmergencyId } from '../content/rescue';
import type { StickerId } from '../content/stickers';
import { fromMarkup, s } from '../core/svg';
import { DARK_METAL, INK, METAL } from './palette';
import { stickerArt } from './stickers';

/** Rescue Station art. Same style as everywhere: flat colors, thick outlines, no filters. */
const O = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const O8 = `stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;
export const RESCUE_BACKDROP = '#9aa3ad';

/** The firehouse for the town map, in a 460×380 box (ground at 380). */
export function rescueBuilding(): SVGGElement {
  const bricks: string[] = [];
  for (let y = 130; y < 370; y += 30) bricks.push(`<path d="M40 ${y} H420" stroke="#b23a2e" stroke-width="4"/>`);
  return fromMarkup(`
    <ellipse cx="230" cy="380" rx="230" ry="16" fill="#5e8f4e" opacity="0.6"/>
    <rect x="40" y="110" width="380" height="270" rx="10" fill="#d9534f" ${O8}/>
    ${bricks.join('')}
    <rect x="20" y="90" width="420" height="36" rx="10" fill="#f4f4f4" ${O8}/>
    <path d="M110 380 V250 Q110 190 170 190 H290 Q350 190 350 250 V380 Z" fill="#c9d1d8" ${O8}/>
    <path d="M118 236 H342 M114 280 H346 M112 324 H348" stroke="${INK}" stroke-width="5"/>
    <circle cx="230" cy="150" r="30" fill="#f2b33d" ${O}/>
    <path d="M230 128 L237 143 L254 145 L241 156 L245 173 L230 164 L215 173 L219 156 L206 145 L223 143 Z" fill="#ffffff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="200" y="40" width="60" height="50" rx="8" fill="#d9534f" ${O}/>
    <path d="M208 40 Q230 14 252 40" fill="#f2b33d" ${O}/>
    <rect x="216" y="56" width="28" height="22" rx="6" fill="#ffcf3d" stroke="${INK}" stroke-width="4"/>`);
}

/** The big red alarm bell on a post (opens Who Can Help). Box x 70–250, y 300–690. */
export function alarmBell(): SVGGElement {
  return fromMarkup(`
    <rect x="148" y="400" width="24" height="290" fill="${DARK_METAL}" ${O}/>
    <rect x="108" y="672" width="104" height="18" rx="6" fill="${DARK_METAL}" ${O}/>
    <path d="M90 420 Q90 312 160 306 Q230 312 230 420 Z" fill="#e4473b" ${O8}/>
    <rect x="80" y="414" width="160" height="22" rx="10" fill="#c9372d" ${O8}/>
    <circle cx="160" cy="448" r="14" fill="${METAL}" ${O}/>
    <path d="M118 340 Q132 322 152 318" fill="none" stroke="#ff8a7d" stroke-width="8" stroke-linecap="round"/>`);
}

/** The dispatch desk Pops stands behind. */
export function dispatchDesk(): SVGGElement {
  return fromMarkup(`
    <rect x="300" y="560" width="400" height="140" fill="#e4473b" ${O8}/>
    <rect x="320" y="580" width="360" height="20" rx="8" fill="#ff8a7d"/>
    <rect x="284" y="530" width="432" height="40" rx="10" fill="#4a4f57" ${O8}/>`);
}

/** A big friendly radio on the desk (opens Siren Sounds). Box x 420–600, y 400–540. */
export function radioSet(): SVGGElement {
  return fromMarkup(`
    <path d="M470 430 L440 380" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="438" cy="376" r="9" fill="#e4473b" ${O}/>
    <rect x="420" y="426" width="180" height="110" rx="20" fill="#3d7fe0" ${O8}/>
    <circle cx="470" cy="482" r="32" fill="${DARK_METAL}" ${O}/>
    <circle cx="470" cy="482" r="12" fill="#9aa3ad"/>
    <rect x="520" y="452" width="60" height="22" rx="6" fill="#fff3c4" ${O}/>
    <circle cx="536" cy="504" r="10" fill="#f2b33d" ${O}/><circle cx="566" cy="504" r="10" fill="#3fae5a" ${O}/>`);
}

/** The fire hose reel on the wall (opens Fire Hose). Box x 900–1230, y 380–690. */
export function hoseReel(): SVGGElement {
  return fromMarkup(`
    <rect x="1050" y="480" width="24" height="210" fill="${DARK_METAL}" ${O}/>
    <circle cx="1062" cy="480" r="100" fill="#e4473b" ${O8}/>
    <circle cx="1062" cy="480" r="70" fill="none" stroke="#c9372d" stroke-width="18"/>
    <circle cx="1062" cy="480" r="40" fill="none" stroke="#c9372d" stroke-width="18"/>
    <circle cx="1062" cy="480" r="16" fill="${METAL}" ${O}/>
    <path d="M1150 520 Q1200 560 1170 620 L1150 660" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
    <path d="M1150 520 Q1200 560 1170 620 L1150 660" fill="none" stroke="#f2b33d" stroke-width="12" stroke-linecap="round"/>
    <rect x="1130" y="650" width="40" height="34" rx="6" fill="${METAL}" ${O}/>`);
}

/** The station room: a garage bay with the fire truck and ambulance parked inside. */
export function rescueBack(): SVGGElement {
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1500" fill="#f0e2d0"/>
    <rect x="-1280" y="-800" width="3840" height="110" fill="#d9534f"/>
    <rect x="460" y="120" width="780" height="420" rx="18" fill="#c9d1d8" ${O8}/>
    <path d="M850 120 V540" stroke="${INK}" stroke-width="8"/>
    <rect x="-1280" y="690" width="3840" height="1000" fill="#9aa3ad"/>
    <path d="M-1280 740 H2560" stroke="#8a929b" stroke-width="5"/>`);
}

/** The badge board on the wall (same spot as the post office's stamp board). */
export function badgeBoard(): SVGGElement {
  return fromMarkup(`
    <rect x="180" y="60" width="262" height="196" rx="14" fill="#4a4f57" ${O8}/>
    <rect x="196" y="76" width="230" height="164" rx="8" fill="#6b7480"/>`);
}

/** A rescue badge: a sticker picture inside a gold star badge, in a 100×100 box. */
export function badgeArt(id: StickerId): SVGGElement {
  const badge = fromMarkup(`
    <path d="M50 2 L62 30 L94 32 L70 54 L78 88 L50 72 L22 88 L30 54 L6 32 L38 30 Z" fill="#f2b33d" ${O}/>`);
  const pic = stickerArt(id);
  pic.setAttribute('transform', 'translate(27 28) scale(0.46)');
  return s('g', {}, [badge, pic]);
}

/** One flame, centered on (0,0); it flickers (the scene animates it gently). */
export function flameArt(): SVGGElement {
  return fromMarkup(`
    <path d="M0 -70 Q40 -30 34 10 Q30 44 0 46 Q-30 44 -34 10 Q-38 -24 -8 -40 Q-6 -20 6 -14 Q10 -42 0 -70 Z" fill="#f07f2a" ${O}/>
    <path d="M0 -26 Q20 -4 16 18 Q12 34 0 34 Q-12 34 -16 18 Q-18 0 0 -26 Z" fill="#ffd34d"/>`);
}

/** A little splash of water drops, centered on (0,0). */
export function splashArt(): SVGGElement {
  return fromMarkup(`
    <path d="M0 -30 Q14 -8 0 6 Q-14 -8 0 -30 Z" fill="#7fb4ef" stroke="${INK}" stroke-width="4"/>
    <path d="M-30 -6 Q-18 12 -30 22 Q-42 12 -30 -6 Z" fill="#7fb4ef" stroke="${INK}" stroke-width="4"/>
    <path d="M30 -6 Q42 12 30 22 Q18 12 30 -6 Z" fill="#7fb4ef" stroke="${INK}" stroke-width="4"/>`);
}

/** A house for the fire hose game, in a 520×420 box (ground at 420). Flame spots are returned. */
export function flamesHouse(): { house: SVGGElement; spots: { x: number; y: number }[] } {
  const house = fromMarkup(`
    <rect x="40" y="170" width="440" height="250" rx="12" fill="#f7d774" ${O8}/>
    <path d="M10 180 L260 30 L510 180 Z" fill="#d9534f" ${O8}/>
    <rect x="80" y="230" width="100" height="90" rx="8" fill="#bfe7f7" ${O}/>
    <rect x="340" y="230" width="100" height="90" rx="8" fill="#bfe7f7" ${O}/>
    <path d="M220 420 V320 Q220 290 260 290 Q300 290 300 320 V420 Z" fill="#3fae5a" ${O}/>`);
  return {
    house,
    spots: [
      { x: 130, y: 260 },
      { x: 390, y: 260 },
      { x: 200, y: 140 },
      { x: 330, y: 130 },
      { x: 260, y: 70 },
    ],
  };
}

/** Pictures of each emergency, drawn in a 320×220 box (shown on the dispatch screen). */
const EMERGENCY_ART: Record<EmergencyId, string> = {
  fire: `
    <rect x="70" y="90" width="180" height="120" rx="8" fill="#f7d774" ${O}/>
    <path d="M50 96 L160 30 L270 96 Z" fill="#d9534f" ${O}/>
    <path d="M110 120 Q130 90 124 70 Q150 92 146 120 Z M190 110 Q210 76 202 56 Q232 84 226 112 Z" fill="#f07f2a" ${O}/>
    <path d="M150 40 Q170 10 164 -6 Q192 18 186 44 Z" fill="#f07f2a" ${O}/>`,
  hurt: `
    <circle cx="160" cy="80" r="42" fill="#f2c29b" ${O}/>
    <path d="M140 74 q6 6 12 0 M168 74 q6 6 12 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M144 100 Q160 90 176 100" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M118 210 V150 Q118 126 160 126 Q202 126 202 150 V210 Z" fill="#3fae5a" ${O}/>
    <rect x="186" y="150" width="60" height="22" rx="10" fill="#f6efe2" ${O} transform="rotate(-20 216 161)"/>
    <path d="M210 152 V170 M220 150 V168" stroke="#e4473b" stroke-width="3"/>`,
  traffic: `
    <rect x="0" y="150" width="320" height="70" fill="#6b7480"/>
    <rect x="20" y="110" width="90" height="56" rx="16" fill="#3d7fe0" ${O}/>
    <rect x="118" y="104" width="90" height="62" rx="16" fill="#e85fa4" ${O}/>
    <rect x="216" y="110" width="90" height="56" rx="16" fill="#3fae5a" ${O}/>
    <circle cx="42" cy="170" r="12" fill="#333840"/><circle cx="90" cy="170" r="12" fill="#333840"/>
    <circle cx="140" cy="170" r="12" fill="#333840"/><circle cx="188" cy="170" r="12" fill="#333840"/>
    <circle cx="238" cy="170" r="12" fill="#333840"/><circle cx="286" cy="170" r="12" fill="#333840"/>
    <path d="M60 80 V50 M160 70 V40 M260 80 V50" stroke="#e4473b" stroke-width="10" stroke-linecap="round"/>
    <circle cx="60" cy="96" r="6" fill="#e4473b"/><circle cx="160" cy="86" r="6" fill="#e4473b"/><circle cx="260" cy="96" r="6" fill="#e4473b"/>`,
  brokenCar: `
    <rect x="0" y="170" width="320" height="50" fill="#6b7480"/>
    <path d="M70 176 V136 Q70 116 90 116 H130 L160 86 H220 Q236 86 242 100 L262 136 Q272 140 272 156 V176 Z" fill="#f07f2a" ${O}/>
    <circle cx="110" cy="180" r="22" fill="#333840" ${O}/>
    <ellipse cx="230" cy="190" rx="28" ry="12" fill="#333840" ${O}/>
    <path d="M250 90 Q270 60 252 40 Q286 50 280 80 Q306 70 300 40" fill="none" stroke="#9aa3ad" stroke-width="12" stroke-linecap="round"/>`,
};

export function emergencyArt(id: EmergencyId): SVGGElement {
  return fromMarkup(EMERGENCY_ART[id]);
}

/** The dispatch screen the emergency picture appears on (center x 640, y 300). */
export function dispatchScreen(): SVGGElement {
  return fromMarkup(`
    <rect x="450" y="150" width="380" height="290" rx="22" fill="#4a4f57" ${O8}/>
    <rect x="474" y="174" width="332" height="236" rx="12" fill="#e8f4fb"/>`);
}

/** A small desk in front of Pops at the left of the game screens. */
export function sideDesk(): SVGGElement {
  return fromMarkup(`
    <rect x="-60" y="572" width="350" height="150" fill="#e4473b" ${O8}/>
    <rect x="-70" y="550" width="370" height="34" rx="10" fill="#4a4f57" ${O8}/>`);
}
