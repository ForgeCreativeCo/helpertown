import type { StickerId } from '../content/stickers';
import { fromMarkup } from '../core/svg';
import { INK } from './palette';
import { toolMarkup } from './tools';

/** Round sticker badges, drawn in a 100×100 box (center 50,50). */
const O = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

export function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.48;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

const ICONS: Record<StickerId, { ring: string; icon: string }> = {
  star: { ring: '#f2b33d', icon: `<path d="${starPath(50, 52, 30)}" fill="#ffd34d" ${O}/>` },
  bigStar: {
    ring: '#e85fa4',
    icon: `<path d="${starPath(46, 54, 30)}" fill="#ffd34d" ${O}/><path d="${starPath(76, 28, 11)}" fill="#fff3a0" ${O}/>`,
  },
  rex: {
    ring: '#3fae5a',
    icon: `
      <path d="M18 66 Q30 58 40 60 L44 48 Q48 30 64 28 L78 28 Q86 30 84 40 L76 44 L66 46 L62 58 Q66 70 58 76 L56 84 L48 84 L48 76 L38 76 L36 84 L28 84 L30 72 Q22 72 18 66 Z" fill="#6cc46a" ${O}/>
      <circle cx="70" cy="35" r="3" fill="${INK}"/>
      <path d="M60 56 L68 60" ${O}/>`,
  },
  longNeck: {
    ring: '#3d7fe0',
    icon: `
      <path d="M14 70 Q30 52 48 54 L60 40 Q64 20 76 18 Q86 18 84 26 L74 30 L70 50 Q72 70 62 74 L60 84 L52 84 L52 76 L36 76 L34 84 L26 84 L26 74 Q18 74 14 70 Z" fill="#7fb4ef" ${O}/>
      <circle cx="78" cy="23" r="2.5" fill="${INK}"/>`,
  },
  hornDino: {
    ring: '#f07f2a',
    icon: `
      <path d="M16 68 Q26 50 46 52 L62 52 Q66 38 76 36 Q88 40 86 54 Q90 62 80 66 Q72 72 64 70 L62 84 L54 84 L52 74 L36 74 L34 84 L26 84 L26 74 Q18 74 16 68 Z" fill="#f5a35c" ${O}/>
      <path d="M78 40 L90 30 M70 38 L74 26" ${O}/>
      <circle cx="78" cy="54" r="2.5" fill="${INK}"/>`,
  },
  dumpTruck: {
    ring: '#f2b33d',
    icon: `
      <path d="M14 40 L54 40 L58 64 L14 64 Z" fill="#f2b33d" ${O}/>
      <path d="M58 46 L74 46 L86 58 L86 66 L58 66 Z" fill="#f2b33d" ${O}/>
      <rect x="64" y="50" width="12" height="9" fill="#bfe7f7" ${O}/>
      <circle cx="28" cy="70" r="9" fill="#333840" ${O}/><circle cx="72" cy="70" r="9" fill="#333840" ${O}/>`,
  },
  fireTruck: {
    ring: '#e4473b',
    icon: `
      <path d="M12 44 L62 44 L62 68 L12 68 Z" fill="#e4473b" ${O}/>
      <path d="M62 48 L78 48 L88 60 L88 68 L62 68 Z" fill="#e4473b" ${O}/>
      <rect x="68" y="52" width="10" height="8" fill="#bfe7f7" ${O}/>
      <path d="M16 38 L58 32 M22 37 L22 33 M32 36 L32 32 M42 34 L42 30 M52 33 L52 29" ${O}/>
      <rect x="40" y="38" width="10" height="6" fill="#4a90e2" ${O}/>
      <circle cx="26" cy="72" r="9" fill="#333840" ${O}/><circle cx="74" cy="72" r="9" fill="#333840" ${O}/>`,
  },
  digger: {
    ring: '#f07f2a',
    icon: `
      <rect x="14" y="66" width="50" height="14" rx="7" fill="#333840" ${O}/>
      <path d="M18 66 L18 48 L48 48 L56 60 L56 66 Z" fill="#f07f2a" ${O}/>
      <rect x="22" y="52" width="14" height="10" fill="#bfe7f7" ${O}/>
      <path d="M52 52 L70 30 L84 44" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M52 52 L70 30 L84 44" fill="none" stroke="#f07f2a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M78 44 L92 44 L88 58 L76 56 Z" fill="#4a4f57" ${O}/>`,
  },
  hammer: { ring: '#e4473b', icon: `<g transform="translate(18 18) scale(0.4) rotate(-20 80 80)">${toolMarkup('hammer')}</g>` },
  wrench: { ring: '#3d7fe0', icon: `<g transform="translate(18 18) scale(0.4) rotate(25 80 80)">${toolMarkup('wrench')}</g>` },
};

export function stickerArt(id: StickerId): SVGGElement {
  const { ring, icon } = ICONS[id];
  return fromMarkup(`
    <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="${INK}" stroke-width="5"/>
    <circle cx="50" cy="50" r="39" fill="none" stroke="${ring}" stroke-width="7"/>
    ${icon}
  `);
}
