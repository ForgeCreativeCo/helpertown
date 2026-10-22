/**
 * Small motion vocabulary. Everything animates transform and opacity only, and
 * nothing repeats faster than about once a second (well under 3 flashes/sec).
 */
type El = Element & { animate: Element['animate'] };

const EASE_OUT = 'cubic-bezier(.2,.8,.3,1)';

/** Squash-and-stretch hop. */
export function bounce(el: El, height = 30): Animation {
  return el.animate(
    [
      { transform: 'translateY(0) scale(1, 1)' },
      { transform: 'translateY(0) scale(1.08, 0.9)', offset: 0.15 },
      { transform: `translateY(${-height}px) scale(0.95, 1.08)`, offset: 0.45 },
      { transform: 'translateY(0) scale(1.06, 0.94)', offset: 0.75 },
      { transform: 'translateY(0) scale(1, 1)' },
    ],
    { duration: 520, easing: 'ease-in-out' },
  );
}

/** A small side-to-side wobble (used for "that's the saw"). */
export function wiggle(el: El): Animation {
  return el.animate(
    [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-7deg)' },
      { transform: 'rotate(6deg)' },
      { transform: 'rotate(-4deg)' },
      { transform: 'rotate(2deg)' },
      { transform: 'rotate(0deg)' },
    ],
    { duration: 520, easing: 'ease-in-out' },
  );
}

/** A slow breathing pulse that loops: an invitation to tap. */
export function breathe(el: El, amount = 0.04, period = 2200, delay = 0): Animation {
  return el.animate(
    [{ transform: 'scale(1)' }, { transform: `scale(${1 + amount})` }, { transform: 'scale(1)' }],
    { duration: period, iterations: Infinity, easing: 'ease-in-out', delay },
  );
}

/** A gentle sway that loops (idle life). */
export function sway(el: El, deg = 3, period = 2600, delay = 0): Animation {
  return el.animate(
    [{ transform: 'rotate(0deg)' }, { transform: `rotate(${deg}deg)` }, { transform: `rotate(${-deg}deg)` }, { transform: 'rotate(0deg)' }],
    { duration: period, iterations: Infinity, easing: 'ease-in-out', delay },
  );
}

export function fadeTo(el: El, from: number, to: number, duration: number): Animation {
  return el.animate([{ opacity: from }, { opacity: to }], { duration, easing: 'ease-in-out', fill: 'forwards' });
}

export function popIn(el: El, duration = 420): Animation {
  return el.animate(
    [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.12)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    { duration, easing: EASE_OUT, fill: 'backwards' },
  );
}

/** Where a piece sits: its center on the stage, rotation and scale. */
export interface Place {
  x: number;
  y: number;
  rot?: number;
  scale?: number;
}

function placeTransform(p: Place, origin: { x: number; y: number }, css: boolean): string {
  const u = css ? 'px' : '';
  const d = css ? 'deg' : '';
  const sep = css ? ', ' : ' ';
  return `translate(${p.x}${u}${sep}${p.y}${u}) rotate(${p.rot ?? 0}${d}) scale(${p.scale ?? 1}) translate(${-origin.x}${u}${sep}${-origin.y}${u})`;
}

/**
 * Positions an SVG group by its center. `origin` is the art's own center
 * (e.g. 80,80 for a 160-unit tool).
 */
export function placeAt(el: SVGElement, p: Place, origin: { x: number; y: number }): void {
  el.setAttribute('transform', placeTransform(p, origin, false));
}

/**
 * Flies a placed group along an arc to a new place, then commits the end
 * position. `lift` is how far the arc bulges upward.
 */
export function flyArc(
  el: SVGElement,
  from: Place,
  to: Place,
  origin: { x: number; y: number },
  duration = 650,
  lift = 160,
): Promise<void> {
  const steps = 10;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lerp = (a: number, b: number) => a + (b - a) * t;
    const p: Place = {
      x: lerp(from.x, to.x),
      y: lerp(from.y, to.y) - Math.sin(Math.PI * t) * lift,
      rot: lerp(from.rot ?? 0, to.rot ?? 0),
      scale: lerp(from.scale ?? 1, to.scale ?? 1),
    };
    frames.push({ transform: placeTransform(p, origin, true) });
  }
  const a = el.animate(frames, { duration, easing: 'ease-in-out', fill: 'forwards' });
  return finished(a).then(() => {
    placeAt(el, to, origin);
    a.cancel();
  });
}

export function finished(a: Animation): Promise<void> {
  return a.finished.then(
    () => undefined,
    () => undefined,
  );
}
