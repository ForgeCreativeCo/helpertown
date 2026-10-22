import { INK } from '../art/palette';
import { breathe, popIn } from './anim';
import type { SceneContext } from './scenes';
import { fromMarkup, s } from './svg';

/**
 * The gentle idle pause: the scene dims behind one big play button. Taps
 * anywhere else do nothing. Resolves when the play button is tapped.
 */
export function showPause(ctx: SceneContext, svg: SVGSVGElement): Promise<void> {
  const dim = s('rect', { x: -1280, y: -800, width: 3840, height: 2400, fill: '#1c120b', opacity: 0.55 });
  const button = fromMarkup(`
    <circle cx="640" cy="400" r="140" fill="#3fae5a" stroke="${INK}" stroke-width="12"/>
    <path d="M520 340 a130 130 0 0 1 180 -50" fill="none" stroke="#8fe09f" stroke-width="16" stroke-linecap="round"/>
    <path d="M600 320 L725 400 L600 480 Z" fill="#fff8e8" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>
  `);
  button.setAttribute('class', 'tf');
  const hit = s('circle', { cx: 640, cy: 400, r: 190, fill: 'transparent' });
  const group = s('g', {}, [dim, s('g', { class: 'tf' }, [hit, button])]);
  svg.append(group);
  popIn(button);
  const pulse = ctx.keep(breathe(button, 0.06, 1800));
  // The dim layer swallows taps so nothing underneath reacts.
  const offDim = ctx.tap(dim, () => undefined);
  return new Promise((resolve) => {
    const off = ctx.tap(hit.parentElement!, () => {
      off();
      offDim();
      pulse.cancel();
      group.remove();
      ctx.sfx('pop');
      resolve();
    });
  });
}
