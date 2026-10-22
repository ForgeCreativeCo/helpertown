import type { ToolId } from '../content/tools';
import { fromMarkup } from '../core/svg';
import { DARK_METAL, INK, METAL } from './palette';

/**
 * The seven tools, each drawn in a 160×160 box (center 80,80): chunky,
 * slightly exaggerated, one strong color each.
 */
export const TOOL_SIZE = 160;

const O = `stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;

function sawTeeth(): string {
  const pts: string[] = [];
  for (let x = 56, i = 0; x <= 150; x += 9, i++) {
    // The blade's bottom edge runs from (50,116) to (156,100).
    const y = 116 - ((x - 50) / 106) * 16;
    pts.push(`${x} ${i % 2 === 0 ? y : y + 10}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
}

const MARKUP: Record<ToolId, string> = {
  hammer: `
    <rect x="68" y="52" width="24" height="102" rx="10" fill="#b5773d" ${O}/>
    <rect x="75" y="66" width="6" height="76" rx="3" fill="#d9a066"/>
    <path d="M116 24 L140 10 Q154 20 142 34 L118 54 Z" fill="#e4473b" ${O}/>
    <rect x="26" y="18" width="94" height="42" rx="10" fill="#e4473b" ${O}/>
    <rect x="12" y="22" width="18" height="34" rx="5" fill="${METAL}" ${O}/>
    <rect x="36" y="25" width="62" height="8" rx="4" fill="#ff8a7d"/>`,
  wrench: `
    <rect x="68" y="62" width="24" height="76" rx="10" fill="#3d7fe0" ${O}/>
    <circle cx="80" cy="140" r="17" fill="#3d7fe0" ${O}/>
    <circle cx="80" cy="140" r="6" fill="#1e3f73"/>
    <path d="M67 8.4 L67 40 L93 40 L93 8.4 A36 36 0 1 1 67 8.4 Z" fill="#3d7fe0" ${O}/>
    <rect x="72" y="58" width="16" height="22" fill="#3d7fe0"/>
    <rect x="75" y="84" width="6" height="40" rx="3" fill="#8fb8f5"/>`,
  screwdriver: `
    <rect x="73" y="90" width="14" height="50" fill="${METAL}" ${O}/>
    <path d="M73 138 L87 138 L84 154 L76 154 Z" fill="${METAL}" ${O}/>
    <rect x="62" y="80" width="36" height="14" rx="4" fill="${DARK_METAL}" ${O}/>
    <rect x="50" y="8" width="60" height="78" rx="24" fill="#f2b33d" ${O}/>
    <path d="M68 24 V70 M80 24 V70 M92 24 V70" stroke="#c98a1e" stroke-width="5" stroke-linecap="round"/>
    <rect x="58" y="16" width="8" height="30" rx="4" fill="#ffd982"/>`,
  saw: `
    <path d="M50 50 L150 66 Q156 68 156 74 L156 100 L50 116 Z" fill="${METAL}" ${O}/>
    ${sawTeeth()}
    <path d="M62 60 L140 72" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <path d="M8 42 Q8 30 20 30 L56 30 Q68 30 68 42 L68 124 Q68 136 56 136 L20 136 Q8 136 8 124 Z" fill="#3fae5a" ${O}/>
    <rect x="22" y="54" width="32" height="58" rx="15" fill="#226b35" ${O}/>`,
  drill: `
    <rect x="138" y="49" width="20" height="10" rx="3" fill="${METAL}" ${O}/>
    <rect x="120" y="40" width="22" height="28" rx="6" fill="${DARK_METAL}" ${O}/>
    <rect x="38" y="66" width="38" height="68" rx="12" fill="#f07f2a" ${O}/>
    <rect x="76" y="76" width="12" height="20" rx="5" fill="${DARK_METAL}" ${O}/>
    <rect x="16" y="26" width="110" height="54" rx="25" fill="#f07f2a" ${O}/>
    <rect x="26" y="128" width="62" height="24" rx="6" fill="${DARK_METAL}" ${O}/>
    <path d="M40 44 V62 M52 44 V62 M64 44 V62" stroke="#b9561a" stroke-width="5" stroke-linecap="round"/>
    <rect x="80" y="34" width="34" height="8" rx="4" fill="#ffb27a"/>`,
  pump: `
    <path d="M98 118 Q142 118 142 88 Q142 60 122 60" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
    <path d="M98 118 Q142 118 142 88 Q142 60 122 60" fill="none" stroke="#333840" stroke-width="8" stroke-linecap="round"/>
    <rect x="108" y="52" width="18" height="16" rx="4" fill="${DARK_METAL}" ${O}/>
    <rect x="76" y="20" width="8" height="30" fill="${METAL}" ${O}/>
    <rect x="36" y="8" width="88" height="20" rx="10" fill="#6a3fb0" ${O}/>
    <rect x="30" y="134" width="100" height="18" rx="6" fill="${DARK_METAL}" ${O}/>
    <rect x="60" y="42" width="40" height="98" rx="12" fill="#8b5cd6" ${O}/>
    <circle cx="80" cy="96" r="16" fill="#ffffff" ${O}/>
    <path d="M80 96 L89 87" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="67" y="50" width="7" height="30" rx="3" fill="#b99af0"/>`,
  paintbrush: `
    <path d="M70 78 L90 78 L88 150 Q80 158 72 150 Z" fill="#e85fa4" ${O}/>
    <rect x="76" y="90" width="5" height="44" rx="2.5" fill="#f7a8cf"/>
    <rect x="60" y="56" width="40" height="26" rx="4" fill="${METAL}" ${O}/>
    <path d="M60 66 H100" stroke="${INK}" stroke-width="4"/>
    <path d="M62 58 L62 30 Q64 8 80 4 Q96 8 98 30 L98 58 Z" fill="#f3e2b8" ${O}/>
    <path d="M64 30 Q64 9 80 6 Q96 9 96 30 Q88 38 80 31 Q72 38 64 30 Z" fill="#e85fa4"/>
    <path d="M62 58 L62 30 Q64 8 80 4 Q96 8 98 30 L98 58" fill="none" ${O}/>`,
};

export function toolArt(id: ToolId): SVGGElement {
  return fromMarkup(MARKUP[id]);
}

export function toolMarkup(id: ToolId): string {
  return MARKUP[id];
}
