import { GLOW } from '../art/palette';
import type { SceneContext } from './scenes';
import { s } from './svg';

/**
 * A soft pulsing halo behind something, used for hints. It pulses slower than
 * once a second, far below the 3-flashes-per-second limit.
 */
export function addGlow(ctx: SceneContext, parent: SVGElement, cx: number, cy: number, r: number): () => void {
  const halo = s('circle', { cx, cy, r, fill: GLOW, class: 'tf no-hit', opacity: 0.8 });
  parent.insertBefore(halo, parent.firstChild);
  const a = ctx.keep(
    halo.animate(
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
    halo.remove();
  };
}
