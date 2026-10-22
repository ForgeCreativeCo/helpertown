import type { Pops } from '../art/pops';
import type { SceneContext } from '../core/scenes';

/** Pops breathes gently and blinks every few seconds. */
export function popsLife(ctx: SceneContext, pops: Pops): void {
  ctx.keep(
    pops.body.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.012, 0.99)' }, { transform: 'scale(1)' }], {
      duration: 3200,
      iterations: Infinity,
      easing: 'ease-in-out',
    }),
  );
  const blink = () => {
    pops.blink();
    ctx.after(2500 + Math.random() * 2500, blink);
  };
  ctx.after(1500, blink);
}
