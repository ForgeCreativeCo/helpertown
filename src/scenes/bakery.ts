import { bakeItemArt } from '../art/bakery';
import { KITCHEN_BACKDROP } from '../art/kitchen';
import { INK } from '../art/palette';
import { homeButton } from '../art/workshop';
import { lineId } from '../content/lines';
import { bounce, placeAt, sway } from '../core/anim';
import type { Scene } from '../core/scenes';
import { fromMarkup, s, stageSvg } from '../core/svg';
import { navButton, watchSession } from './common';

/** Three long shelves; each holds four of the newest things he made. */
const SHELF_Y = [270, 470, 670];
const SLOT_X = [330, 560, 790, 1020];
const SHOWN = SHELF_Y.length * SLOT_X.length;

/**
 * The Bakery Shelf: everything he baked and decorated, big enough to tap.
 * Tapping one says what it is. Like his garage, but it just keeps filling up.
 */
export function bakeryScene(): Scene {
  return {
    backdrop: KITCHEN_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const shelves = SHELF_Y.map(
        (y) => `<rect x="190" y="${y}" width="960" height="24" rx="8" fill="#c98a4b" stroke="${INK}" stroke-width="8"/>
                <path d="M240 ${y + 24} l20 30 M1090 ${y + 24} l-20 30" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`,
      ).join('');
      svg.append(
        fromMarkup(`
          <rect x="-1280" y="-800" width="3840" height="2400" fill="#f3e2c0"/>
          <rect x="-1280" y="-800" width="3840" height="860" fill="#cdeadf"/>
          <path d="M-1280 60 H2560" stroke="#b5ddd0" stroke-width="12"/>
          ${shelves}
        `),
      );
      ctx.root.append(svg);

      const items = ctx.progress.bakery.slice(-SHOWN);
      items.forEach((item, i) => {
        const art = bakeItemArt(item);
        art.setAttribute('class', 'tf-bottom');
        const hit = s('rect', { x: -14, y: -14, width: 128, height: 128, rx: 24, fill: 'transparent' });
        const g = s('g', {}, [hit, art]);
        const shelf = SHELF_Y[Math.floor(i / SLOT_X.length)]!;
        placeAt(g, { x: SLOT_X[i % SLOT_X.length]!, y: shelf - 66, scale: 1.3 }, { x: 50, y: 50 });
        svg.append(g);
        ctx.keep(sway(art, 2, 3000 + i * 170, i * 220));
        ctx.tap(g, () => {
          bounce(art, 24);
          ctx.sfx('sparkle');
          void ctx.speak(item.kind === 'muffin' ? lineId('bakery.muffin', item.flavor) : 'bakery.cookie', { replaceQueued: true });
        });
      });

      navButton(ctx, svg, homeButton(110, 120), 110, 120, 'nav.kitchen', 'kitchen');
      ctx.after(300, () => void ctx.speak(items.length ? 'bakery.hello' : 'bakery.empty'));
      // No rounds here; if the session ends, head back to the kitchen to wind down.
      watchSession(ctx, 5000, () => ctx.go('kitchen'));
    },
  };
}
