import type { ProblemId } from '../content/problems';
import { fromMarkup, s } from '../core/svg';
import { DARK_METAL, INK, METAL } from './palette';
import type { VehicleArt } from './vehicles';

/**
 * A visible problem on a vehicle, drawn in the vehicle's own coordinates.
 * `set(f)` shows fix progress from 0 (broken) to 1 (fixed) one tap at a time;
 * `done()` plays the final flourish and leaves the vehicle looking normal.
 */
export interface ProblemView {
  el: SVGGElement;
  /** Where to tap and where the hint ring goes. */
  spot: { x: number; y: number; r: number };
  set(f: number): void;
  done(): Promise<void>;
}

const EASE = 'transform 280ms cubic-bezier(.3,1.4,.6,1), opacity 280ms ease-out';

/** Positions a group at a point; its child `inner` is the one that animates. */
function at(x: number, y: number, markup: string): { el: SVGGElement; inner: SVGGElement } {
  const inner = fromMarkup(markup);
  inner.setAttribute('class', 'tf');
  inner.style.transition = EASE;
  return { el: s('g', { transform: `translate(${x} ${y})` }, [inner]), inner };
}

function darker(hex: string, k = 0.72): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `rgb(${c.join(',')})`;
}

function finishedAfter(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Little white puffs (air, dust) that float up once. */
function puff(parent: SVGGElement, x: number, y: number, color = '#ffffff'): void {
  for (let i = 0; i < 3; i++) {
    const c = s('circle', { cx: x + (i - 1) * 14, cy: y, r: 8 + i * 2, fill: color, opacity: 0 });
    parent.append(c);
    c.animate(
      [
        { opacity: 0.9, transform: 'translate(0px, 0px) scale(0.6)' },
        { opacity: 0, transform: `translate(${(i - 1) * 10}px, -36px) scale(1.2)` },
      ],
      { duration: 600, delay: i * 60, easing: 'ease-out' },
    ).onfinish = () => c.remove();
  }
}

function flatTire(v: VehicleArt): ProblemView {
  const wheel = v.frontWheel!;
  const t = v.anchors.tire!;
  wheel.style.transition = EASE;
  const squash = (f: number) => `scale(${1.18 - 0.18 * f}, ${0.72 + 0.28 * f})`;
  wheel.style.transform = squash(0);
  const el = s('g');
  return {
    el,
    spot: { x: t.x, y: t.y, r: 62 },
    set(f) {
      wheel.style.transform = squash(f);
      puff(el, t.x - 30, t.y - 30);
    },
    async done() {
      wheel.style.transform = '';
      await finishedAfter(300);
    },
  };
}

function looseWheel(v: VehicleArt): ProblemView {
  const wheel = v.frontWheel!;
  const t = v.anchors.tire!;
  wheel.style.transition = EASE;
  // The wheel sits loose (pulled out a little) and wobbles side to side...
  const offset = (f: number) => `translateX(${12 * (1 - f)}px)`;
  wheel.style.transform = offset(0);
  const wobble = wheel.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }], {
    duration: 240,
    iterations: Infinity,
    direction: 'alternate',
    easing: 'ease-in-out',
    composite: 'add',
  });
  const shake = fromMarkup(
    `<path d="M${t.x - 58} ${t.y - 20} q-10 20 0 40 M${t.x - 70} ${t.y - 28} q-14 28 0 56" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  );
  shake.style.transition = 'opacity 280ms';
  // ...because its nut fell off and is lying on the floor beside it.
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return `${(Math.cos(a) * 13).toFixed(1)},${(Math.sin(a) * 13).toFixed(1)}`;
  }).join(' ');
  const nut = at(t.x, t.y, `<polygon points="${hex}" fill="${METAL}" stroke="${INK}" stroke-width="5"/><circle r="5" fill="${DARK_METAL}"/>`);
  const place = (f: number) => `translate(${74 * (1 - f)}px, ${32 * (1 - f)}px) rotate(${f * 360}deg)`;
  nut.inner.style.transform = place(0);
  return {
    el: s('g', {}, [shake, nut.el]),
    spot: { x: t.x + 20, y: t.y, r: 66 },
    set(f) {
      wheel.style.transform = offset(f);
      nut.inner.style.transform = place(f);
      shake.style.opacity = String(1 - f);
    },
    async done() {
      wobble.cancel();
      wheel.style.transform = '';
      shake.remove();
      await finishedAfter(300);
    },
  };
}

function dent(v: VehicleArt): ProblemView {
  const p = v.anchors.panel;
  const shade = darker(v.color);
  const d = at(
    p.x,
    p.y,
    `<path d="M-46 -6 L-30 -26 L-8 -18 L6 -34 L22 -16 L44 -22 L38 2 L50 18 L24 22 L10 38 L-6 20 L-30 30 L-26 10 Z" fill="${shade}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
     <path d="M-24 -4 L-6 4 L12 -6 M-8 20 L2 4 L20 10" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  );
  return {
    el: d.el,
    spot: { x: p.x, y: p.y, r: 70 },
    set(f) {
      d.inner.style.transform = `scale(${1 - 0.8 * f})`;
      d.inner.style.opacity = String(1 - 0.7 * f);
    },
    async done() {
      d.inner.style.opacity = '0';
      await finishedAfter(300);
      d.el.remove();
    },
  };
}

function looseScrew(v: VehicleArt): ProblemView {
  const p = v.anchors.door;
  const screw = at(
    p.x,
    p.y,
    `<path d="M0 0 L-26 -26" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
     <path d="M0 0 L-26 -26" stroke="${METAL}" stroke-width="6" stroke-linecap="round"/>
     <circle cx="-30" cy="-30" r="12" fill="${METAL}" stroke="${INK}" stroke-width="5"/>
     <path d="M-37 -37 L-23 -23" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  );
  const rattle = fromMarkup(
    `<path d="M${p.x + 22} ${p.y - 18} q8 10 0 20 M${p.x + 32} ${p.y - 24} q12 16 0 32" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  );
  rattle.style.transition = 'opacity 280ms';
  const shake = screw.inner.animate([{ transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }], {
    duration: 260,
    iterations: Infinity,
    direction: 'alternate',
    composite: 'add',
  });
  const el = s('g', {}, [rattle, screw.el]);
  return {
    el,
    spot: { x: p.x - 10, y: p.y - 10, r: 60 },
    set(f) {
      screw.inner.style.transform = `translate(${18 * f}px, ${18 * f}px) rotate(${f * 540}deg)`;
      rattle.style.opacity = String(1 - f);
    },
    async done() {
      shake.cancel();
      rattle.remove();
      await finishedAfter(300);
    },
  };
}

function branch(v: VehicleArt): ProblemView {
  const p = v.anchors.roof;
  const b = at(
    p.x,
    p.y - 12,
    `<path d="M-84 6 Q-20 -4 84 -6" stroke="${INK}" stroke-width="20" stroke-linecap="round" fill="none"/>
     <path d="M-84 6 Q-20 -4 84 -6" stroke="#8a5a35" stroke-width="10" stroke-linecap="round" fill="none"/>
     <path d="M-30 0 L-46 -26 M30 -4 L44 -30" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
     <path d="M-30 0 L-46 -26 M30 -4 L44 -30" stroke="#8a5a35" stroke-width="5" stroke-linecap="round"/>
     <circle cx="-50" cy="-34" r="20" fill="#5bbf5a" stroke="${INK}" stroke-width="5"/>
     <circle cx="48" cy="-38" r="22" fill="#5bbf5a" stroke="${INK}" stroke-width="5"/>
     <circle cx="84" cy="-12" r="16" fill="#7fd47c" stroke="${INK}" stroke-width="5"/>
     <circle cx="-86" cy="-2" r="14" fill="#7fd47c" stroke="${INK}" stroke-width="5"/>`,
  );
  const cut = s('rect', { x: -3, y: -12, width: 6, height: 4, rx: 2, fill: INK });
  b.inner.append(cut);
  return {
    el: b.el,
    spot: { x: p.x, y: p.y - 20, r: 80 },
    set(f) {
      cut.setAttribute('height', String(4 + 18 * f));
      b.inner.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0deg)' }], {
        duration: 260,
        composite: 'add',
      });
      puff(b.el, 0, 6, '#e6c48f');
    },
    async done() {
      b.inner.style.transition = 'none';
      const a = b.inner.animate(
        [
          { transform: 'translate(0px, 0px) rotate(0deg)', opacity: 1 },
          { transform: 'translate(60px, 320px) rotate(70deg)', opacity: 0 },
        ],
        { duration: 750, easing: 'ease-in', fill: 'forwards' },
      );
      await a.finished.catch(() => undefined);
      b.el.remove();
    },
  };
}

function missingLight(v: VehicleArt): ProblemView {
  const p = v.anchors.light;
  v.light.style.opacity = '0';
  const dots = [0, 1, 2, 3].map((i) => {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const c = s('circle', { cx: (p.x + Math.cos(a) * 12).toFixed(1), cy: (p.y + Math.sin(a) * 12).toFixed(1), r: 3.5, fill: METAL, opacity: 0 });
    return c;
  });
  const el = s('g', {}, [s('circle', { cx: p.x, cy: p.y, r: 17, fill: '#333840', stroke: INK, 'stroke-width': 6 }), ...dots]);
  return {
    el,
    spot: { x: p.x, y: p.y, r: 54 },
    set(f) {
      dots.forEach((d, i) => d.setAttribute('opacity', i < Math.round(f * 4) ? '1' : '0'));
    },
    async done() {
      v.light.style.opacity = '1';
      v.light.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
      await finishedAfter(420);
      el.remove();
    },
  };
}

function scratch(v: VehicleArt): ProblemView {
  const p = v.anchors.panel;
  const marks = fromMarkup(`
    <path d="M-54 -16 L-34 -24 L-14 -12 L8 -22 L30 -10 L52 -18" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-48 2 L-26 -6 L-4 6 L18 -4 L42 4" fill="none" stroke="#9aa3ad" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-40 18 L-18 10 L4 20 L26 12" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
  marks.setAttribute('transform', `translate(${p.x} ${p.y})`);
  // Fresh paint sweeps across from the left, then blends back into the body.
  const patch = s('rect', { x: p.x - 64, y: p.y - 34, width: 128, height: 68, rx: 24, fill: v.color });
  patch.style.transformBox = 'fill-box';
  patch.style.transformOrigin = '0% 50%';
  patch.style.transform = 'scaleX(0)';
  patch.style.transition = 'transform 280ms ease-out, opacity 500ms ease-out';
  const el = s('g', {}, [marks, patch]);
  return {
    el,
    spot: { x: p.x, y: p.y, r: 70 },
    set(f) {
      patch.style.transform = `scaleX(${f})`;
    },
    async done() {
      patch.style.transform = 'scaleX(1)';
      await finishedAfter(300);
      marks.remove();
      patch.style.opacity = '0';
      await finishedAfter(500);
      el.remove();
    },
  };
}

const MAKERS: Record<ProblemId, (v: VehicleArt) => ProblemView> = {
  flatTire,
  looseWheel,
  dent,
  looseScrew,
  branch,
  missingLight,
  scratch,
};

/** Draws a problem onto a vehicle and appends it to the vehicle's body. */
export function addProblem(v: VehicleArt, id: ProblemId): ProblemView {
  const view = MAKERS[id](v);
  view.el.classList.add('no-hit');
  v.body.append(view.el);
  return view;
}
