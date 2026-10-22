import { s } from '../core/svg';
import { INK } from './palette';

let clipId = 0;

/** A real photo in a chunky wooden frame (the real Pops on the workshop wall). */
export function woodFrame(url: string, x: number, y: number, w: number, h: number): SVGGElement {
  const id = `photo-clip-${++clipId}`;
  const inset = 12;
  const clip = s('clipPath', { id }, [s('rect', { x: x + inset, y: y + inset, width: w - inset * 2, height: h - inset * 2, rx: 8 })]);
  const img = s('image', {
    href: url,
    x: x + inset,
    y: y + inset,
    width: w - inset * 2,
    height: h - inset * 2,
    preserveAspectRatio: 'xMidYMid slice',
    'clip-path': `url(#${id})`,
  });
  return s('g', { class: 'tf' }, [
    s('defs', {}, [clip]),
    s('rect', { x, y, width: w, height: h, rx: 14, fill: '#a0612f', stroke: INK, 'stroke-width': 8 }),
    s('rect', { x: x + inset - 3, y: y + inset - 3, width: w - inset * 2 + 6, height: h - inset * 2 + 6, rx: 9, fill: '#fff8e8' }),
    img,
    s('rect', { x: x + inset, y: y + inset, width: w - inset * 2, height: h - inset * 2, rx: 8, fill: 'none', stroke: INK, 'stroke-width': 4 }),
    s('circle', { cx: x + w / 2, cy: y - 14, r: 6, fill: INK }),
    s('path', { d: `M${x + 18} ${y + 4} L${x + w / 2} ${y - 14} L${x + w - 18} ${y + 4}`, fill: 'none', stroke: INK, 'stroke-width': 4 }),
  ]);
}

/** His photo in a round frame wearing a yellow hard hat (in his garage). */
export function hardHatPhoto(url: string, cx: number, cy: number, r: number): SVGGElement {
  const id = `photo-clip-${++clipId}`;
  return s('g', { class: 'tf' }, [
    s('defs', {}, [s('clipPath', { id }, [s('circle', { cx, cy, r })])]),
    s('circle', { cx, cy, r: r + 10, fill: '#f2b33d', stroke: INK, 'stroke-width': 8 }),
    s('image', { href: url, x: cx - r, y: cy - r, width: r * 2, height: r * 2, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${id})` }),
    s('circle', { cx, cy, r, fill: 'none', stroke: INK, 'stroke-width': 5 }),
    // The hard hat, perched on top of the frame.
    s('path', {
      d: `M${cx - r * 0.85} ${cy - r * 0.62} Q${cx - r * 0.8} ${cy - r * 1.55} ${cx} ${cy - r * 1.58} Q${cx + r * 0.8} ${cy - r * 1.55} ${cx + r * 0.85} ${cy - r * 0.62} Z`,
      fill: '#f5c518',
      stroke: INK,
      'stroke-width': 7,
      'stroke-linejoin': 'round',
    }),
    s('rect', { x: cx - r * 1.1, y: cy - r * 0.72, width: r * 2.2, height: r * 0.24, rx: r * 0.12, fill: '#e0b10e', stroke: INK, 'stroke-width': 6 }),
    s('path', { d: `M${cx} ${cy - r * 1.55} V${cy - r * 0.74}`, stroke: '#c79a10', 'stroke-width': 8, 'stroke-linecap': 'round' }),
  ]);
}
