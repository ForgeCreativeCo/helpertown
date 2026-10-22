import { GLOW, INK } from '../art/palette';
import type { SceneContext } from './scenes';
import { s } from './svg';

/**
 * A hint glow. 'halo' is a soft disc behind something (tools); 'ring' is an
 * outlined ring drawn on top (a spot on a vehicle). Both pulse slower than
 * once a second, far below the 3-flashes-per-second limit.
 */
export function addGlow(
  ctx: SceneContext,
  parent: SVGElement,
  cx: number,
  cy: number,
  r: number,
  mode: 'halo' | 'ring' = 'halo',
): () => void {
  const el =
    mode === 'halo'
      ? s('circle', { cx, cy, r, fill: GLOW, class: 'tf no-hit', opacity: 0.8 })
      : s('g', { class: 'tf no-hit' }, [
          s('circle', { cx, cy, r, fill: 'none', stroke: INK, 'stroke-width': 16 }),
          s('circle', { cx, cy, r, fill: 'none', stroke: GLOW, 'stroke-width': 9 }),
        ]);
  if (mode === 'halo') parent.insertBefore(el, parent.firstChild);
  else parent.append(el);
  const a = ctx.keep(
    el.animate(
      [
        { opacity: 0.35, transform: 'scale(0.92)' },
        { opacity: 0.9, transform: 'scale(1.08)' },
        { opacity: 0.35, transform: 'scale(0.92)' },
      ],
      { duration: 1400, iterations: Infinity, easing: 'ease-in-out' },
    ),
  );
  return () => {
    a.cancel();
    el.remove();
  };
}
