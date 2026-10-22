import { Pops, type Character } from '../art/characters';
import { DINO_BACKDROP, dinoBack, dinoPark, fossilArt, museumShelf, puzzleTable, sandbox } from '../art/dinos';
import { townButton } from '../art/town';
import { getDino } from '../content/dinos';
import { lineId } from '../content/lines';
import { bounce, placeAt, popIn, wiggle } from '../core/anim';
import { recordRound } from '../core/progress';
import type { Scene, SceneContext } from '../core/scenes';
import type { ActivityId } from '../core/storage';
import { fromMarkup, hitGroup, s, stageSvg } from '../core/svg';
import { characterLife, navButton, takeTurnsHopping, watchSession, windDown } from './common';

const FOSSIL_SCALE = 0.55;

/** End of a Dino Dig round: a celebration, then back to the dig site. */
export async function finishDinoRound(ctx: SceneContext, activity: ActivityId, host: Character, svg: SVGSVGElement, params: Record<string, unknown> = {}): Promise<void> {
  recordRound(ctx.progress, activity);
  ctx.save();
  await ctx.celebrate({ pops: host, svg });
  ctx.go('dino', { params });
}

/**
 * Dino Dig: the sandbox opens the dig, the puzzle table opens Dino Puzzle,
 * the dino park opens Big and Little, and the museum shelf shows his fossils.
 */
export function dinoScene(): Scene {
  return {
    backdrop: DINO_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const { shelf, slots } = museumShelf();
      svg.append(dinoBack(), shelf);
      ctx.root.append(svg);

      const pops = new Pops(250, 170, 0.74);
      svg.append(pops.el);
      characterLife(ctx, pops);

      const spots = [
        { art: sandbox(), box: { x: 40, y: 500, w: 400, h: 220 }, line: 'dino.sandbox', scene: 'dig' },
        { art: puzzleTable(), box: { x: 490, y: 470, w: 300, h: 250 }, line: 'dino.puzzleTable', scene: 'puzzle' },
        { art: dinoPark(), box: { x: 860, y: 280, w: 380, h: 440 }, line: 'dino.park', scene: 'sizes' },
      ];
      const arts: SVGGElement[] = [];
      for (const spot of spots) {
        const inner = s('g', { class: 'tf-bottom' }, [spot.art]);
        const el = hitGroup(inner, spot.box, 20);
        svg.append(el);
        arts.push(inner);
        ctx.tap(el, () => {
          ctx.sfx('tap');
          wiggle(inner);
          ctx.app.input.lock();
          ctx.onCleanup(() => ctx.app.input.unlock());
          const { x, y, w, h } = spot.box;
          void ctx.speak(spot.line, { replaceQueued: true }).then(() => ctx.go(spot.scene, { from: { x: x + w / 2, y: y + h / 2 } }));
        });
      }
      takeTurnsHopping(ctx, arts);

      // The museum: his newest fossils on the shelf. Tapping one says its name.
      const shown = ctx.progress.fossils.slice(-slots.length);
      shown.forEach((id, i) => {
        const slot = slots[i]!;
        const art = fossilArt(id);
        art.setAttribute('class', 'tf-bottom');
        const hit = s('rect', { x: -10, y: 20, width: 320, height: 280, fill: 'transparent' });
        const g = s('g', {}, [hit, art]);
        placeAt(g, { x: slot.x, y: slot.y, scale: FOSSIL_SCALE }, { x: 150, y: 150 });
        svg.append(g);
        ctx.tap(g, () => {
          wiggle(art);
          ctx.sfx('sparkle');
          void ctx.speak(lineId('sticker.say', getDino(id).nameSticker), { replaceQueued: true });
        });
        if (ctx.params.newFossil && i === shown.length - 1) {
          art.style.opacity = '0';
          ctx.after(450, () => {
            art.style.opacity = '';
            popIn(art, 500);
            ctx.sfx('sparkle');
          });
        }
      });

      let line = 0;
      ctx.tap(pops.el, () => {
        bounce(pops.body, 24);
        ctx.sfx('boing');
        pops.pose(line % 2 === 0 ? 'waving' : 'thumbsUp');
        ctx.after(1400, () => pops.pose('idle'));
        void ctx.speak(line++ % 2 === 0 ? 'pops.hello' : 'pops.giggle', { replaceQueued: true });
      });

      navButton(ctx, svg, townButton(96, 92), 96, 92, 'nav.town', 'town');
      if (ctx.params.greet) ctx.after(250, () => void ctx.speak('dino.hello'));

      // When the session is over: Pops yawns, waves, and a tarp covers the sandbox.
      watchSession(ctx, ctx.params.greet ? 4000 : 900, () => {
        const tarp = fromMarkup(`<rect x="30" y="540" width="420" height="180" rx="20" fill="#3d7fe0" opacity="0.92"/>`);
        tarp.style.transformOrigin = '240px 540px';
        void windDown(ctx, svg, {
          host: pops,
          goodbyeLine: 'winddown.goodbye',
          closing: {
            layers: [tarp],
            play: () => tarp.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 4000, easing: 'ease-in-out', fill: 'forwards' }),
          },
        });
      });
    },
  };
}
