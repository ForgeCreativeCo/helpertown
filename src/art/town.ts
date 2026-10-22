import { fromMarkup } from '../core/svg';
import { DARK_METAL, INK } from './palette';

/**
 * Helper Town from above-ish: a sunny street with each place he can visit.
 * Only places that exist are drawn (no locked or "coming soon" buildings).
 */
export function townBackground(): SVGGElement {
  const dashes: string[] = [];
  for (let x = -1280; x < 2560; x += 90) dashes.push(`<rect x="${x}" y="636" width="50" height="10" rx="5" fill="#f4f4f4"/>`);
  return fromMarkup(`
    <rect x="-1280" y="-800" width="3840" height="1150" fill="#a9dcf5"/>
    <circle cx="1130" cy="96" r="52" fill="#ffe27a" stroke="#f2b33d" stroke-width="8"/>
    <path d="M-1280 330 Q-600 220 0 300 Q300 240 640 290 Q980 220 1280 290 Q1900 230 2560 320 V600 H-1280 Z" fill="#8fd27a"/>
    <rect x="-1280" y="330" width="3840" height="1300" fill="#7cc46b"/>
    <rect x="-1280" y="596" width="3840" height="90" fill="#6b7480"/>
    <rect x="-1280" y="590" width="3840" height="10" fill="#4a4f57"/>
    <rect x="-1280" y="684" width="3840" height="10" fill="#4a4f57"/>
    ${dashes.join('')}
    <path d="M300 560 L280 596 H380 L360 560 Z" fill="#c9b79a"/>
    <path d="M940 560 L920 596 H1000 L980 560 Z" fill="#c9b79a"/>
  `);
}

/** Puffy clouds that drift slowly across the sky. */
export function cloud(x: number, y: number, s = 1): SVGGElement {
  return fromMarkup(`
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 40 Q0 10 30 12 Q40 -10 70 0 Q100 -8 108 20 Q130 22 128 44 Q126 60 104 60 H20 Q0 60 0 40 Z" fill="#ffffff" stroke="#d8eef8" stroke-width="5"/>
    </g>`);
}

export function tree(x: number, ground: number, s = 1): SVGGElement {
  return fromMarkup(`
    <g transform="translate(${x} ${ground}) scale(${s})">
      <rect x="-12" y="-80" width="24" height="80" rx="8" fill="#8a5a35" stroke="${INK}" stroke-width="6"/>
      <circle cx="0" cy="-120" r="56" fill="#3fae5a" stroke="${INK}" stroke-width="7"/>
      <circle cx="-26" cy="-134" r="14" fill="#6cc46a"/>
    </g>`);
}

/** Pops' Workshop: a wooden shop with a big garage door and a tool sign. */
export function workshopBuilding(): SVGGElement {
  const slats: string[] = [];
  for (let y = 392; y < 556; y += 34) slats.push(`<rect x="166" y="${y}" width="188" height="26" rx="4" fill="#e9eef2" stroke="${INK}" stroke-width="4"/>`);
  return fromMarkup(`
    <ellipse cx="330" cy="566" rx="240" ry="16" fill="#5e8f4e" opacity="0.6"/>
    <rect x="130" y="300" width="400" height="262" rx="10" fill="#c98a4b" stroke="${INK}" stroke-width="10"/>
    <path d="M150 340 H510 M150 380 H510 M150 420 H510 M150 460 H510 M150 500 H510" stroke="#b9773d" stroke-width="5"/>
    <path d="M104 316 L330 186 L556 316 Z" fill="#e4473b" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
    <path d="M150 300 L330 200 L510 300" fill="none" stroke="#ff8a7d" stroke-width="8" stroke-linecap="round"/>
    <rect x="156" y="380" width="208" height="182" rx="6" fill="#6b7480" stroke="${INK}" stroke-width="8"/>
    ${slats.join('')}
    <rect x="398" y="430" width="90" height="132" rx="10" fill="#5b3a24" stroke="${INK}" stroke-width="8"/>
    <circle cx="470" cy="500" r="7" fill="#f2b33d" stroke="${INK}" stroke-width="3"/>
    <!-- Sign with a crossed hammer and wrench -->
    <rect x="236" y="318" width="188" height="50" rx="12" fill="#f2b33d" stroke="${INK}" stroke-width="7"/>
    <g stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M300 360 L360 326" stroke="#a0612f" stroke-width="10"/>
      <rect x="348" y="318" width="26" height="14" rx="3" fill="#e4473b" transform="rotate(-30 361 325)"/>
      <path d="M300 326 L360 360" stroke="#3d7fe0" stroke-width="10"/>
      <circle cx="296" cy="324" r="9" fill="#3d7fe0"/>
    </g>
  `);
}

/** Mama's house: a cozy yellow home with a pie in the window and a smoking chimney. */
export function mamaHouse(): SVGGElement {
  return fromMarkup(`
    <ellipse cx="950" cy="566" rx="230" ry="16" fill="#5e8f4e" opacity="0.6"/>
    <rect x="1052" y="210" width="44" height="90" rx="6" fill="#b35a4a" stroke="${INK}" stroke-width="8"/>
    <rect x="760" y="318" width="380" height="244" rx="10" fill="#f7d774" stroke="${INK}" stroke-width="10"/>
    <path d="M734 330 L950 196 L1166 330 Z" fill="#d9534f" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
    <path d="M780 316 L950 212 L1120 316" fill="none" stroke="#f08a80" stroke-width="8" stroke-linecap="round"/>
    <path d="M910 562 V470 Q910 430 950 430 Q990 430 990 470 V562 Z" fill="#3fae5a" stroke="${INK}" stroke-width="8"/>
    <circle cx="972" cy="502" r="7" fill="#f2b33d" stroke="${INK}" stroke-width="3"/>
    <path d="M950 410 C930 396 932 380 942 380 C946 380 950 384 950 388 C950 384 954 380 958 380 C968 380 970 396 950 410 Z" fill="#e85fa4" stroke="${INK}" stroke-width="4"/>
    <!-- Left window with curtains -->
    <rect x="790" y="370" width="100" height="84" rx="8" fill="#bfe7f7" stroke="${INK}" stroke-width="7"/>
    <path d="M794 374 Q812 410 800 450 H794 Z M886 374 Q868 410 880 450 H886 Z" fill="#e85fa4"/>
    <rect x="782" y="452" width="116" height="14" rx="6" fill="#ffffff" stroke="${INK}" stroke-width="5"/>
    <!-- Right window with a pie cooling on the sill -->
    <rect x="1010" y="370" width="100" height="84" rx="8" fill="#bfe7f7" stroke="${INK}" stroke-width="7"/>
    <rect x="1002" y="452" width="116" height="14" rx="6" fill="#ffffff" stroke="${INK}" stroke-width="5"/>
    <path d="M1026 452 Q1060 420 1094 452 Z" fill="#e0a466" stroke="${INK}" stroke-width="5"/>
    <path d="M1040 444 L1048 436 M1060 440 L1060 430 M1074 444 L1068 436" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <!-- Flower boxes -->
    <circle cx="806" cy="474" r="8" fill="#e4473b"/><circle cx="830" cy="476" r="8" fill="#f2b33d"/><circle cx="856" cy="474" r="8" fill="#e85fa4"/>
    <circle cx="1028" cy="474" r="8" fill="#f2b33d"/><circle cx="1054" cy="476" r="8" fill="#e85fa4"/><circle cx="1080" cy="474" r="8" fill="#e4473b"/>
  `);
}

/** A blue round "go to town" button with two little houses on it. */
export function townButton(cx: number, cy: number): SVGGElement {
  return fromMarkup(`
    <circle cx="${cx}" cy="${cy}" r="60" fill="#3d7fe0" stroke="${INK}" stroke-width="10"/>
    <path d="M${cx - 40} ${cy + 26} H${cx + 40}" stroke="#7cc46b" stroke-width="10" stroke-linecap="round"/>
    <path d="M${cx - 34} ${cy + 20} V${cy - 4} L${cx - 18} ${cy - 20} L${cx - 2} ${cy - 4} V${cy + 20} Z" fill="#f7d774" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M${cx + 4} ${cy + 20} V${cy - 10} L${cx + 20} ${cy - 28} L${cx + 36} ${cy - 10} V${cy + 20} Z" fill="#fff8e8" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="${cx + 14}" y="${cy + 2}" width="12" height="18" rx="3" fill="#e4473b" stroke="${INK}" stroke-width="3"/>
    <rect x="${cx - 24}" y="${cy + 4}" width="12" height="16" rx="3" fill="${DARK_METAL}"/>
  `);
}
