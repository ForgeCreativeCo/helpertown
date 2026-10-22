const SVG_NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number | undefined>;

/** Creates an SVG element with attributes and children. */
export function s<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (SVGElement | string)[] = [],
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) el.setAttribute(k, String(v));
  for (const c of children) el.append(c);
  return el;
}

/** A full-stage SVG (1280×800 logical units) that can draw past its edges. */
export function stageSvg(): SVGSVGElement {
  return s('svg', { viewBox: '0 0 1280 800', width: 1280, height: 800 });
}

/** Builds SVG markup from a string; handy for static art. */
export function fromMarkup(markup: string): SVGGElement {
  const g = s('g');
  g.innerHTML = markup;
  return g;
}

/**
 * Wraps art in a tappable group with an invisible hit area padded beyond the
 * art, so near-misses still count.
 */
export function hitGroup(
  art: SVGElement,
  box: { x: number; y: number; w: number; h: number },
  pad = 30,
  className = 'tf',
): SVGGElement {
  const hit = s('rect', {
    x: box.x - pad,
    y: box.y - pad,
    width: box.w + pad * 2,
    height: box.h + pad * 2,
    rx: 40,
    fill: 'transparent',
  });
  return s('g', { class: className }, [hit, art]);
}
