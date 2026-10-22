import { s } from '../core/svg';
import { INK } from './palette';

/**
 * The grown-ups he helps, drawn with one shared rig so they share every pose:
 *   Pops: an original cartoon grandpa (cap, glasses, big mustache, overalls).
 *   Mama: an original cartoon mom (hair in a bun, apron with a heart pocket).
 * Each is drawn in a local 300×470 box; `x, y, scale` place them on the stage.
 * Poses swap the arms, eyes and mouth. Only `body` is ever animated, so the
 * placement transform on `el` is never overwritten.
 */
export type PopsPose =
  | 'idle'
  | 'asking'
  | 'pointing'
  | 'thumbsUp'
  | 'highFive'
  | 'cheering'
  | 'yawning'
  | 'waving'
  | 'holding';

const SKIN = '#f2c29b';
const SHIRT = '#f6d27a';
const OVERALLS = '#3d6fb6';
const CAP = '#e4473b';
const MOUTH = '#8a2b2b';

type Pt = [number, number];
type HandKind = 'fist' | 'open' | 'thumb' | 'point';
interface ArmSpec {
  pts: Pt[];
  hand: HandKind;
  /** Hand rotation in degrees (open hands point their fingers this way; 0 = up). */
  rot?: number;
}

const SHOULDER_L: Pt = [80, 300];
const SHOULDER_R: Pt = [220, 300];

const L_REST: ArmSpec = { pts: [SHOULDER_L, [40, 380], [70, 448]], hand: 'fist' };
const R_REST: ArmSpec = { pts: [SHOULDER_R, [260, 380], [230, 448]], hand: 'fist' };
const R_ASK: ArmSpec = { pts: [SHOULDER_R, [272, 372], [322, 352]], hand: 'open', rot: 80 };
const R_THUMB: ArmSpec = { pts: [SHOULDER_R, [292, 345], [300, 268]], hand: 'thumb' };
const R_HIGH: ArmSpec = { pts: [SHOULDER_R, [288, 240], [300, 150]], hand: 'open', rot: 10 };
const R_CHEER: ArmSpec = { pts: [SHOULDER_R, [280, 222], [304, 140]], hand: 'open', rot: 20 };
const L_CHEER: ArmSpec = { pts: [SHOULDER_L, [20, 222], [-4, 140]], hand: 'open', rot: -20 };
const L_STRETCH: ArmSpec = { pts: [SHOULDER_L, [36, 214], [52, 132]], hand: 'fist' };
const R_HOLD: ArmSpec = { pts: [SHOULDER_R, [280, 372], [330, 330]], hand: 'fist' };

/** Where the right hand holds a tool, in local coordinates. */
const HOLD_POINT: Pt = [330, 330];

/** What makes a character look like themselves (everything but arms, eyes and mouth). */
export interface Look {
  skin: string;
  sleeve: string;
  torso: string;
  head: string;
  face: string;
  top: string;
}

function armMarkup(a: ArmSpec, look: Look): string {
  const d = `M${a.pts.map((p) => p.join(' ')).join(' L')}`;
  const [hx, hy] = a.pts[a.pts.length - 1]!;
  return `
    <path d="${d}" fill="none" stroke="${INK}" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${look.sleeve}" stroke-width="31" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(${hx} ${hy}) rotate(${a.rot ?? 0})">${handMarkup(a.hand, look.skin)}</g>
  `;
}

function handMarkup(kind: HandKind, skin: string): string {
  const sk = `fill="${skin}" stroke="${INK}" stroke-width="7"`;
  switch (kind) {
    case 'open':
      return `
        <ellipse cx="-15" cy="-26" rx="8" ry="15" ${sk}/>
        <ellipse cx="0" cy="-31" rx="8" ry="16" ${sk}/>
        <ellipse cx="15" cy="-26" rx="8" ry="15" ${sk}/>
        <ellipse cx="-27" cy="-2" rx="14" ry="8" ${sk} transform="rotate(-30 -27 -2)"/>
        <circle r="25" ${sk}/>`;
    case 'thumb':
      return `<rect x="-8" y="-50" width="16" height="34" rx="8" ${sk}/><circle r="25" ${sk}/>`;
    case 'point':
      return `<rect x="10" y="-8" width="40" height="16" rx="8" ${sk}/><circle r="25" ${sk}/>`;
    case 'fist':
      return `<circle r="25" ${sk}/>`;
  }
}

function eyesMarkup(kind: 'open' | 'happy' | 'closed'): string {
  if (kind === 'open') {
    return `
      <circle cx="122" cy="160" r="9" fill="${INK}"/><circle cx="178" cy="160" r="9" fill="${INK}"/>
      <circle cx="125" cy="157" r="3" fill="#fff"/><circle cx="181" cy="157" r="3" fill="#fff"/>`;
  }
  const d = kind === 'happy' ? 'q12 -14 24 0' : 'q12 10 24 0';
  return `
    <path d="M110 164 ${d}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M166 164 ${d}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
}

function mouthMarkup(kind: 'smile' | 'open' | 'grin' | 'yawn'): string {
  switch (kind) {
    case 'smile':
      return `<path d="M128 226 Q150 246 172 226" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
    case 'open':
      return `<ellipse cx="150" cy="231" rx="14" ry="11" fill="${MOUTH}" stroke="${INK}" stroke-width="6"/>`;
    case 'grin':
      return `<path d="M122 222 Q150 262 178 222 Z" fill="${MOUTH}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
              <path d="M136 240 Q150 232 164 240 Q150 250 136 240Z" fill="#e2706a"/>`;
    case 'yawn':
      return `<ellipse cx="150" cy="234" rx="17" ry="22" fill="${MOUTH}" stroke="${INK}" stroke-width="6"/>`;
  }
}

interface PoseSpec {
  left: ArmSpec;
  right: ArmSpec | 'point';
  eyes: 'open' | 'happy' | 'closed';
  mouth: 'smile' | 'open' | 'grin' | 'yawn';
}

const POSES: Record<PopsPose, PoseSpec> = {
  idle: { left: L_REST, right: R_REST, eyes: 'open', mouth: 'smile' },
  asking: { left: L_REST, right: R_ASK, eyes: 'open', mouth: 'open' },
  pointing: { left: L_REST, right: 'point', eyes: 'open', mouth: 'open' },
  thumbsUp: { left: L_REST, right: R_THUMB, eyes: 'happy', mouth: 'grin' },
  highFive: { left: L_REST, right: R_HIGH, eyes: 'open', mouth: 'grin' },
  cheering: { left: L_CHEER, right: R_CHEER, eyes: 'happy', mouth: 'grin' },
  yawning: { left: L_STRETCH, right: R_REST, eyes: 'closed', mouth: 'yawn' },
  waving: { left: L_REST, right: R_HIGH, eyes: 'happy', mouth: 'smile' },
  holding: { left: L_REST, right: R_HOLD, eyes: 'open', mouth: 'smile' },
};

const TORSO = `
  <path d="M50 480 L50 332 Q50 262 150 262 Q250 262 250 332 L250 480 Z" fill="${SHIRT}" stroke="${INK}" stroke-width="9"/>
  <path d="M98 480 L98 330 Q98 318 110 318 L190 318 Q202 318 202 330 L202 480 Z" fill="${OVERALLS}" stroke="${INK}" stroke-width="8"/>
  <path d="M104 322 L84 270 M196 322 L216 270" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
  <path d="M104 322 L84 270 M196 322 L216 270" stroke="${OVERALLS}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="108" cy="330" r="9" fill="#f2b33d" stroke="${INK}" stroke-width="5"/>
  <circle cx="192" cy="330" r="9" fill="#f2b33d" stroke="${INK}" stroke-width="5"/>
  <rect x="122" y="352" width="56" height="38" rx="8" fill="#356099" stroke="${INK}" stroke-width="6"/>
  <rect x="134" y="340" width="10" height="26" rx="4" fill="#f2b33d" stroke="${INK}" stroke-width="4"/>
`;

const HEAD = `
  <circle cx="66" cy="170" r="21" fill="${SKIN}" stroke="${INK}" stroke-width="8"/>
  <circle cx="234" cy="170" r="21" fill="${SKIN}" stroke="${INK}" stroke-width="8"/>
  <circle cx="150" cy="158" r="86" fill="${SKIN}" stroke="${INK}" stroke-width="9"/>
  <path d="M68 108 Q54 134 72 152 Q84 132 92 110 Z" fill="#dcdcdc" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M232 108 Q246 134 228 152 Q216 132 208 110 Z" fill="#dcdcdc" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <circle cx="98" cy="194" r="13" fill="#f29b85" opacity="0.7"/>
  <circle cx="202" cy="194" r="13" fill="#f29b85" opacity="0.7"/>
  <path d="M104 132 Q120 122 138 128 M162 128 Q180 122 196 132" fill="none" stroke="#a8a8a8" stroke-width="10" stroke-linecap="round"/>
`;

const FACE_FRONT = `
  <circle cx="122" cy="160" r="27" fill="#ffffff" fill-opacity="0.3" stroke="${INK}" stroke-width="7"/>
  <circle cx="178" cy="160" r="27" fill="#ffffff" fill-opacity="0.3" stroke="${INK}" stroke-width="7"/>
  <path d="M147 158 Q150 152 153 158" fill="none" stroke="${INK}" stroke-width="6"/>
  <path d="M95 158 L72 164 M205 158 L228 164" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="150" cy="190" rx="18" ry="15" fill="#e8a07e" stroke="${INK}" stroke-width="6"/>
  <path d="M104 212 Q126 194 150 206 Q174 194 196 212 Q182 228 150 220 Q118 228 104 212 Z" fill="#e8e8e8" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
`;

const CAP_MARKUP = `
  <path d="M64 114 Q68 34 150 32 Q232 34 236 114 Z" fill="${CAP}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
  <path d="M96 62 Q120 44 150 42" fill="none" stroke="#ff8a7d" stroke-width="9" stroke-linecap="round"/>
  <path d="M150 104 L270 100 Q288 108 270 120 L150 122 Z" fill="#c9372d" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
  <circle cx="150" cy="78" r="17" fill="#f2b33d" stroke="${INK}" stroke-width="6"/>
  <circle cx="150" cy="78" r="6" fill="${INK}"/>
`;

export const POPS_LOOK: Look = { skin: SKIN, sleeve: SHIRT, torso: TORSO, head: HEAD, face: FACE_FRONT, top: CAP_MARKUP };

export class Character {
  /** Positioned on the stage via its transform attribute. Never animated. */
  readonly el: SVGGElement;
  /** Everything visible. Animate this for bounces and idle motion. */
  readonly body: SVGGElement;
  /** Invisible hit area covering the character. */
  readonly hit: SVGRectElement;
  private armsEl: SVGGElement;
  private eyesEl: SVGGElement;
  private mouthEl: SVGGElement;
  private x: number;
  private y: number;
  private scale: number;
  private look: Look;
  current: PopsPose = 'idle';

  constructor(look: Look, x: number, y: number, scale = 1) {
    this.look = look;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.hit = s('rect', { x: -10, y: 20, width: 320, height: 460, rx: 60, fill: 'transparent' });
    this.armsEl = s('g');
    this.eyesEl = s('g', { class: 'tf' });
    this.mouthEl = s('g');
    const torso = s('g');
    torso.innerHTML = look.torso;
    const head = s('g');
    head.innerHTML = look.head;
    const face = s('g');
    face.innerHTML = look.face;
    const cap = s('g');
    cap.innerHTML = look.top;
    this.body = s('g', { class: 'tf-bottom' }, [torso, this.armsEl, head, this.eyesEl, face, this.mouthEl, cap]);
    this.el = s('g', { transform: `translate(${x} ${y}) scale(${scale})` }, [this.hit, this.body]);
    this.pose('idle');
  }

  pose(p: PopsPose, target?: { x: number; y: number }): void {
    this.current = p;
    const spec = POSES[p];
    let right: ArmSpec;
    let left = spec.left;
    if (spec.right === 'point') {
      const t = target ? this.toLocal(target.x, target.y) : { x: 400, y: 300 };
      // Point with whichever arm is on the target's side.
      if (t.x < 150) {
        left = pointArm(SHOULDER_L, t);
        right = R_REST;
      } else {
        right = pointArm(SHOULDER_R, t);
      }
    } else {
      right = spec.right;
    }
    this.armsEl.innerHTML = armMarkup(left, this.look) + armMarkup(right, this.look);
    this.eyesEl.innerHTML = eyesMarkup(spec.eyes);
    this.mouthEl.innerHTML = mouthMarkup(spec.mouth);
  }

  /** Stage coordinates of the right hand while holding. */
  holdPoint(): { x: number; y: number } {
    return this.toStage(HOLD_POINT[0], HOLD_POINT[1]);
  }

  /** Stage coordinates of Pops' face, for things flying toward him. */
  center(): { x: number; y: number } {
    return this.toStage(150, 200);
  }

  /** A quick blink (eyes squash, never a flash). */
  blink(): void {
    this.eyesEl.animate(
      [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.1)' }, { transform: 'scaleY(1)' }],
      { duration: 180, easing: 'ease-in-out' },
    );
  }

  toLocal(x: number, y: number): { x: number; y: number } {
    return { x: (x - this.x) / this.scale, y: (y - this.y) / this.scale };
  }

  toStage(x: number, y: number): { x: number; y: number } {
    return { x: this.x + x * this.scale, y: this.y + y * this.scale };
  }
}

/** A straight arm from the shoulder toward a target, with a pointing finger. */
function pointArm(shoulder: Pt, target: { x: number; y: number }): ArmSpec {
  const dx = target.x - shoulder[0];
  const dy = target.y - shoulder[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const reach = 150;
  const hand: Pt = [shoulder[0] + ux * reach, shoulder[1] + uy * reach];
  const elbow: Pt = [shoulder[0] + ux * reach * 0.5, shoulder[1] + uy * reach * 0.5];
  return { pts: [shoulder, elbow, hand], hand: 'point', rot: (Math.atan2(uy, ux) * 180) / Math.PI };
}

const MAMA_SKIN = '#efbb93';
const MAMA_SHIRT = '#4bb3a8';
const HAIR = '#6b4226';

const MAMA_TORSO = `
  <path d="M50 480 L50 332 Q50 262 150 262 Q250 262 250 332 L250 480 Z" fill="${MAMA_SHIRT}" stroke="${INK}" stroke-width="9"/>
  <path d="M104 318 L122 268 M196 318 L178 268" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
  <path d="M104 318 L122 268 M196 318 L178 268" stroke="#fff8e8" stroke-width="11" stroke-linecap="round"/>
  <path d="M90 480 L90 330 Q90 312 108 312 L192 312 Q210 312 210 330 L210 480 Z" fill="#fff8e8" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
  <rect x="58" y="398" width="184" height="16" rx="8" fill="#f2b33d" stroke="${INK}" stroke-width="6"/>
  <path d="M150 386 C126 368 128 344 142 344 C147 344 150 349 150 353 C150 349 153 344 158 344 C172 344 174 368 150 386 Z" fill="#e85fa4" stroke="${INK}" stroke-width="5"/>
`;

const MAMA_HEAD = `
  <circle cx="150" cy="40" r="34" fill="${HAIR}" stroke="${INK}" stroke-width="8"/>
  <circle cx="150" cy="154" r="94" fill="${HAIR}" stroke="${INK}" stroke-width="9"/>
  <rect x="126" y="66" width="48" height="14" rx="7" fill="#e85fa4" stroke="${INK}" stroke-width="5"/>
  <circle cx="68" cy="172" r="18" fill="${MAMA_SKIN}" stroke="${INK}" stroke-width="7"/>
  <circle cx="232" cy="172" r="18" fill="${MAMA_SKIN}" stroke="${INK}" stroke-width="7"/>
  <circle cx="150" cy="162" r="82" fill="${MAMA_SKIN}" stroke="${INK}" stroke-width="9"/>
  <circle cx="66" cy="198" r="7" fill="#f2b33d" stroke="${INK}" stroke-width="4"/>
  <circle cx="234" cy="198" r="7" fill="#f2b33d" stroke="${INK}" stroke-width="4"/>
  <circle cx="100" cy="196" r="13" fill="#f29b85" opacity="0.7"/>
  <circle cx="200" cy="196" r="13" fill="#f29b85" opacity="0.7"/>
  <path d="M104 132 Q120 124 138 130 M162 130 Q180 124 196 132" fill="none" stroke="#4a2c18" stroke-width="8" stroke-linecap="round"/>
`;

const MAMA_FACE = `
  <path d="M110 152 l-8 -6 M190 152 l8 -6" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <path d="M146 176 Q150 194 160 186" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
`;

const MAMA_TOP = `
  <path d="M66 156 Q60 72 150 62 Q240 72 234 156 Q218 114 180 106 Q160 128 122 112 Q90 118 66 156 Z" fill="${HAIR}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
  <path d="M100 96 Q124 78 156 76" fill="none" stroke="#8a5a3a" stroke-width="7" stroke-linecap="round"/>
`;

export const MAMA_LOOK: Look = { skin: MAMA_SKIN, sleeve: MAMA_SHIRT, torso: MAMA_TORSO, head: MAMA_HEAD, face: MAMA_FACE, top: MAMA_TOP };

export class Pops extends Character {
  constructor(x: number, y: number, scale = 1) {
    super(POPS_LOOK, x, y, scale);
  }
}

export class Mama extends Character {
  constructor(x: number, y: number, scale = 1) {
    super(MAMA_LOOK, x, y, scale);
  }
}
