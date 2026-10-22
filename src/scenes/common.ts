import type { Pops } from '../art/pops';
import { PRAISE_LINES } from '../content/lines';
import type { SceneContext } from '../core/scenes';

let praiseTurn = 0;

/** The next short extra cheer, rotating so it doesn't get repetitive. */
export function nextPraise(): string {
  return PRAISE_LINES[praiseTurn++ % PRAISE_LINES.length]!;
}

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
