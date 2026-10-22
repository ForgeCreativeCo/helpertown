import type { DinoId } from '../content/dinos';
import { getDino } from '../content/dinos';
import { fromMarkup, s } from '../core/svg';
import { INK } from './palette';

/** Dino Dig art. Dinosaurs are the sticker shapes drawn big, so they look the same everywhere. */
const O = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const O8 = `stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;
export const DINO_BACKDROP = '#e9c98f';

/** Body outlines in a 100×100 box (the same shapes as the stickers). */
const SHAPES: Record<DinoId, { body: string; eye: { x: number; y: number }; extra: string }> = {
  rex: {
    body: 'M18 66 Q30 58 40 60 L44 48 Q48 30 64 28 L78 28 Q86 30 84 40 L76 44 L66 46 L62 58 Q66 70 58 76 L56 84 L48 84 L48 76 L38 76 L36 84 L28 84 L30 72 Q22 72 18 66 Z',
    eye: { x: 70, y: 35 },
    extra: 'M60 56 L68 60',
  },
  longNeck: {
    body: 'M14 70 Q30 52 48 54 L60 40 Q64 20 76 18 Q86 18 84 26 L74 30 L70 50 Q72 70 62 74 L60 84 L52 84 L52 76 L36 76 L34 84 L26 84 L26 74 Q18 74 14 70 Z',
    eye: { x: 78, y: 23 },
    extra: '',
  },
  hornDino: {
    body: 'M16 68 Q26 50 46 52 L62 52 Q66 38 76 36 Q88 40 86 54 Q90 62 80 66 Q72 72 64 70 L62 84 L54 84 L52 74 L36 74 L34 84 L26 84 L26 74 Q18 74 16 68 Z',
    eye: { x: 78, y: 54 },
    extra: 'M78 40 L90 30 M70 38 L74 26',
  },
};

/** A friendly dinosaur in a 300×300 box (feet at about y 252). */
export function dinoArt(id: DinoId, color = getDino(id).color): SVGGElement {
  const sh = SHAPES[id];
  return fromMarkup(`
    <g transform="scale(3)">
      <path d="${sh.body}" fill="${color}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      ${sh.extra ? `<path d="${sh.extra}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` : ''}
      <circle cx="${sh.eye.x}" cy="${sh.eye.y}" r="3.4" fill="#ffffff" stroke="${INK}" stroke-width="1.4"/>
      <circle cx="${sh.eye.x + 0.8}" cy="${sh.eye.y}" r="1.6" fill="${INK}"/>
    </g>`);
}

/** The same dinosaur as fossil bones, in the same 300×300 box. */
export function fossilArt(id: DinoId): SVGGElement {
  const sh = SHAPES[id];
  return fromMarkup(`
    <g transform="scale(3)">
      <path d="${sh.body}" fill="#f6eed8" stroke="#8a6a44" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M32 64 V72 M38 62 V72 M44 62 V72 M50 62 V72" stroke="#c4a97e" stroke-width="2.2" stroke-linecap="round"/>
      ${sh.extra ? `<path d="${sh.extra}" fill="none" stroke="#8a6a44" stroke-width="2.4" stroke-linecap="round"/>` : ''}
      <circle cx="${sh.eye.x}" cy="${sh.eye.y}" r="2.6" fill="#8a6a44"/>
    </g>`);
}

/** A mound of sand covering part of a fossil, centered on (0,0). */
export function dirtClump(): SVGGElement {
  return fromMarkup(`
    <path d="M-78 30 Q-84 -20 -40 -34 Q-10 -62 30 -40 Q80 -36 78 10 Q86 40 50 44 H-50 Q-80 44 -78 30 Z" fill="#c98f52" ${O}/>
    <circle cx="-30" cy="-6" r="8" fill="#a8743f"/><circle cx="24" cy="-16" r="6" fill="#a8743f"/><circle cx="40" cy="18" r="7" fill="#a8743f"/>`);
}

/** The sand pit the dig happens in. */
export function digPit(): SVGGElement {
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1300" fill="#a9dcf5"/>
    <circle cx="1140" cy="80" r="44" fill="#ffe27a" stroke="#f2b33d" stroke-width="8"/>
    <path d="M-1280 300 Q-200 240 300 280 Q800 230 1300 290 Q2000 250 2560 300 V500 H-1280 Z" fill="#d8b77a"/>
    <rect x="-1280" y="300" width="3840" height="1400" fill="#e9c98f"/>
    <path d="M220 330 Q640 290 1120 330 Q1220 520 1100 720 Q640 770 200 720 Q100 520 220 330 Z" fill="#dcae6c" ${O8}/>`);
}

/** The dig site: sand, a little fence and the dino museum on the wall. */
export function dinoBack(): SVGGElement {
  const fence: string[] = [];
  for (let x = -1280; x < 2560; x += 70) fence.push(`<rect x="${x}" y="420" width="22" height="100" rx="6" fill="#c98a4b" stroke="${INK}" stroke-width="4"/>`);
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1400" fill="#a9dcf5"/>
    <circle cx="1180" cy="80" r="44" fill="#ffe27a" stroke="#f2b33d" stroke-width="8"/>
    <rect x="-1280" y="440" width="3840" height="20" fill="#c98a4b" stroke="${INK}" stroke-width="4"/>
    ${fence.join('')}
    <rect x="-1280" y="510" width="3840" height="1200" fill="#e9c98f"/>`);
}

/** The museum shelf (where his newest three fossils stand), at the top middle. Slots are returned. */
export function museumShelf(): { shelf: SVGGElement; slots: { x: number; y: number }[] } {
  const shelf = fromMarkup(`
    <rect x="560" y="24" width="500" height="232" rx="16" fill="#8b5cd6" ${O8}/>
    <rect x="580" y="44" width="460" height="192" rx="10" fill="#f3ecff"/>
    <rect x="574" y="226" width="472" height="16" rx="6" fill="#c98a4b" stroke="${INK}" stroke-width="4"/>`);
  return { shelf, slots: [640, 810, 980].map((x) => ({ x, y: 172 })) };
}

/** The sandbox with a bone poking out (opens the dig). Box x 40–440, y 500–720. */
export function sandbox(): SVGGElement {
  return fromMarkup(`
    <rect x="40" y="560" width="400" height="150" rx="16" fill="#c98a4b" ${O8}/>
    <path d="M60 584 Q140 540 240 570 Q330 540 420 584 V690 H60 Z" fill="#f2d48f" stroke="${INK}" stroke-width="5"/>
    <path d="M190 560 L270 534" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
    <path d="M190 560 L270 534" stroke="#f6eed8" stroke-width="12" stroke-linecap="round"/>
    <circle cx="186" cy="552" r="10" fill="#f6eed8" stroke="${INK}" stroke-width="5"/><circle cx="194" cy="570" r="10" fill="#f6eed8" stroke="${INK}" stroke-width="5"/>
    <circle cx="268" cy="524" r="10" fill="#f6eed8" stroke="${INK}" stroke-width="5"/><circle cx="278" cy="542" r="10" fill="#f6eed8" stroke="${INK}" stroke-width="5"/>
    <path d="M340 600 L380 520" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <path d="M326 596 Q340 640 362 606 Z" fill="#9aa3ad" ${O}/>`);
}

/** The puzzle table (opens the puzzle). Box x 500–780, y 470–720. */
export function puzzleTable(): SVGGElement {
  return fromMarkup(`
    <rect x="520" y="600" width="20" height="110" fill="#8a5a35" ${O}/>
    <rect x="740" y="600" width="20" height="110" fill="#8a5a35" ${O}/>
    <rect x="500" y="580" width="280" height="30" rx="8" fill="#c98a4b" ${O8}/>
    <rect x="540" y="500" width="90" height="80" rx="8" fill="#6cc46a" ${O} transform="rotate(-8 585 540)"/>
    <rect x="640" y="496" width="90" height="84" rx="8" fill="#7fb4ef" ${O} transform="rotate(6 685 538)"/>
    <path d="M560 530 Q585 510 610 530 M660 530 Q685 510 710 530" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`);
}

/** The dino park sign with a long-neck peeking over (opens Big and Little). Box x 860–1240, y 220–720. */
export function dinoPark(): SVGGElement {
  const dino = dinoArt('longNeck');
  dino.setAttribute('transform', 'translate(880 220) scale(1.2)');
  return s('g', {}, [
    dino,
    fromMarkup(`
      <path d="M860 560 H1240 V720 H860 Z" fill="#3fae5a" ${O8}/>
      <path d="M880 560 Q920 520 960 560 Q1000 520 1040 560 Q1080 520 1120 560 Q1160 520 1200 560 Q1220 540 1240 560" fill="#6cc46a" ${O}/>`),
  ]);
}

/** The town building: a sandy dig hut with a dinosaur peeking over the roof. 460×380 box, ground at 380. */
export function dinoBuilding(): SVGGElement {
  const dino = dinoArt('rex');
  dino.setAttribute('transform', 'translate(250 -40) scale(0.62)');
  return s('g', {}, [
    fromMarkup(`<ellipse cx="230" cy="380" rx="230" ry="16" fill="#5e8f4e" opacity="0.6"/>`),
    dino,
    fromMarkup(`
      <rect x="40" y="150" width="380" height="230" rx="10" fill="#e9c98f" ${O8}/>
      <path d="M10 160 L230 70 L450 160 Z" fill="#8b5cd6" ${O8}/>
      <path d="M180 380 V280 Q180 250 230 250 Q280 250 280 280 V380 Z" fill="#a0612f" ${O8}/>
      <rect x="70" y="200" width="80" height="70" rx="8" fill="#bfe7f7" ${O}/>
      <rect x="310" y="200" width="80" height="70" rx="8" fill="#bfe7f7" ${O}/>
      <path d="M190 200 L270 180" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
      <path d="M190 200 L270 180" stroke="#f6eed8" stroke-width="11" stroke-linecap="round"/>
      <circle cx="186" cy="192" r="9" fill="#f6eed8" stroke="${INK}" stroke-width="5"/><circle cx="192" cy="210" r="9" fill="#f6eed8" stroke="${INK}" stroke-width="5"/>
      <circle cx="268" cy="170" r="9" fill="#f6eed8" stroke="${INK}" stroke-width="5"/><circle cx="276" cy="188" r="9" fill="#f6eed8" stroke="${INK}" stroke-width="5"/>`),
  ]);
}

let clipCount = 0;

/** The puzzle picture: the dinosaur filling a 300×300 scene with sky, sun and grass, so every piece shows something. */
function puzzlePicture(id: DinoId): SVGGElement {
  const dino = dinoArt(id);
  dino.setAttribute('transform', 'translate(-55 -40) scale(1.3)');
  return s('g', {}, [
    fromMarkup(`
      <rect x="0" y="0" width="300" height="300" rx="14" fill="#bfe7f7"/>
      <circle cx="62" cy="62" r="34" fill="#ffe27a" stroke="#f2b33d" stroke-width="6"/>
      <rect x="0" y="236" width="300" height="64" fill="#9bd17f"/>`),
    dino,
  ]);
}

export interface PuzzlePiece {
  el: SVGGElement;
  /** The piece's rectangle in the 300×300 picture. */
  rect: { x: number; y: number; w: number; h: number };
}

/** How the picture is cut: halves, thirds, then quarters. */
function cuts(n: number): PuzzlePiece['rect'][] {
  if (n <= 2) return [{ x: 0, y: 0, w: 150, h: 300 }, { x: 150, y: 0, w: 150, h: 300 }];
  if (n === 3) return [0, 1, 2].map((i) => ({ x: i * 100, y: 0, w: 100, h: 300 }));
  return [0, 1, 2, 3].map((i) => ({ x: (i % 2) * 150, y: Math.floor(i / 2) * 150, w: 150, h: 150 }));
}

/**
 * A dinosaur cut into 2–4 pieces for the puzzle, plus the frame with its faint
 * outline. Each piece is the full picture clipped to its own rectangle, so it
 * lines up exactly when it's home.
 */
export function puzzlePieces(id: DinoId, n: number): { frame: SVGGElement; pieces: PuzzlePiece[] } {
  const frame = fromMarkup(`
    <rect x="-14" y="-14" width="328" height="328" rx="22" fill="#fff8e6" ${O8}/>
    <g opacity="0.22"><g transform="translate(-55 -40) scale(1.3)">${dinoArt(id, '#6b7480').innerHTML}</g></g>`);
  const pieces = cuts(n).map((rect) => {
    const clipId = `pz-${++clipCount}`;
    const clip = s('clipPath', { id: clipId }, [s('rect', { x: rect.x, y: rect.y, width: rect.w, height: rect.h })]);
    const pic = puzzlePicture(id);
    pic.setAttribute('clip-path', `url(#${clipId})`);
    const edge = s('rect', { x: rect.x + 2, y: rect.y + 2, width: rect.w - 4, height: rect.h - 4, rx: 10, fill: 'none', stroke: INK, 'stroke-width': 5 });
    const hit = s('rect', { x: rect.x - 30, y: rect.y - 30, width: rect.w + 60, height: rect.h + 60, fill: 'transparent' });
    return { el: s('g', {}, [hit, clip, pic, edge]), rect };
  });
  return { frame, pieces };
}

/** A sand dune in front of Pops at the left of the game screens. */
export function sideDune(): SVGGElement {
  return fromMarkup(`
    <path d="M-120 740 Q-100 590 40 572 Q170 556 280 610 Q330 640 330 740 Z" fill="#dcae6c" ${O8}/>
    <circle cx="60" cy="640" r="9" fill="#c4914f"/><circle cx="180" cy="660" r="7" fill="#c4914f"/>`);
}
