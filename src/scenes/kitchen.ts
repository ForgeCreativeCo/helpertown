import { Mama } from '../art/characters';
import { fridge, fruitBowl, KITCHEN_BACKDROP, kitchenBack, kitchenCounter, MAGNET_SLOTS, magnetArt, plant, teapot, windowShade } from '../art/kitchen';
import { townButton } from '../art/town';
import { lineId } from '../content/lines';
import type { MagnetId } from '../content/magnets';
import { bounce, breathe, placeAt, popIn, sway, wiggle } from '../core/anim';
import type { Scene, SceneContext } from '../core/scenes';
import { hitGroup, s, stageSvg } from '../core/svg';
import { characterLife, navButton, watchSession, windDown } from './common';

/** Mama's Kitchen: the kitchen's own hub. Tap the fridge to help Mama cook. */
export function kitchenScene(): Scene {
  return {
    backdrop: KITCHEN_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const leaves = plant();
      leaves.setAttribute('class', 'tf-bottom');
      svg.append(kitchenBack(), leaves);
      ctx.root.append(svg);
      ctx.keep(sway(leaves, 4, 3400));

      const mama = new Mama(440, 170, 0.8);
      const pot = teapot();
      svg.append(mama.el, kitchenCounter(), fruitBowl(), pot.pot, ...pot.steam);
      characterLife(ctx, mama);
      pot.steam.forEach((w, i) =>
        ctx.keep(
          w.animate(
            [
              { opacity: 0, transform: 'translateY(8px)' },
              { opacity: 0.85, transform: 'translateY(-4px)', offset: 0.4 },
              { opacity: 0, transform: 'translateY(-24px)' },
            ],
            { duration: 2600, delay: i * 1300, iterations: Infinity, easing: 'ease-out' },
          ),
        ),
      );

      // The fridge: where the ingredients are. It opens the cooking game.
      const fridgeArt = fridge();
      fridgeArt.setAttribute('class', 'tf-bottom');
      const fridgeBox = { x: 980, y: 120, w: 250, h: 580 };
      const fridgeEl = hitGroup(fridgeArt, fridgeBox, 20);
      svg.append(fridgeEl);
      ctx.keep(breathe(fridgeArt, 0.02, 2600));
      ctx.tap(fridgeEl, () => {
        ctx.sfx('tap');
        wiggle(fridgeEl);
        ctx.app.input.lock();
        ctx.onCleanup(() => ctx.app.input.unlock());
        void ctx.speak('kitchen.fridge', { replaceQueued: true }).then(() => ctx.go('cook', { from: { x: 1105, y: 410 } }));
      });

      const magnets = s('g');
      svg.append(magnets);
      showMagnets(ctx, magnets, ctx.progress.magnets, ctx.params.newMagnet as MagnetId | undefined);

      let line = 0;
      ctx.tap(mama.el, () => {
        bounce(mama.body, 24);
        ctx.sfx('boing');
        mama.pose(line % 2 === 0 ? 'waving' : 'thumbsUp');
        ctx.after(1400, () => mama.pose('idle'));
        void ctx.speak(line++ % 2 === 0 ? 'mama.hello' : 'mama.giggle', { replaceQueued: true });
      });

      navButton(ctx, svg, townButton(96, 92), 96, 92, 'nav.town', 'town');
      if (ctx.params.greet) ctx.after(250, () => void ctx.speak('kitchen.hello'));

      // When the session is over: Mama yawns, waves, and the window shade comes down.
      watchSession(ctx, ctx.params.greet ? 4000 : 900, () => {
        const shade = windowShade();
        void windDown(ctx, svg, {
          host: mama,
          goodbyeLine: 'mama.goodbye',
          closing: {
            layers: [shade],
            play: () => shade.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 4000, easing: 'ease-in-out', fill: 'forwards' }),
          },
        });
      });
    },
  };
}

/** The newest magnets on the fridge door. Tapping one says what it is. */
function showMagnets(ctx: SceneContext, layer: SVGGElement, earned: MagnetId[], fresh?: MagnetId): void {
  const shown = earned.slice(-MAGNET_SLOTS.length);
  shown.forEach((id, i) => {
    const slot = MAGNET_SLOTS[i]!;
    const art = magnetArt(id);
    art.setAttribute('class', 'tf');
    const hit = s('rect', { x: -6, y: -6, width: 112, height: 112, fill: 'transparent' });
    const g = s('g', {}, [hit, art]);
    placeAt(g, { x: slot.x, y: slot.y, scale: 0.85, rot: [-8, 6, -4, 9][i] ?? 0 }, { x: 50, y: 50 });
    layer.append(g);
    ctx.tap(g, () => {
      wiggle(art);
      ctx.sfx('sparkle');
      void ctx.speak(lineId('magnet.say', id), { replaceQueued: true });
    });
    if (fresh && i === shown.length - 1) {
      art.style.opacity = '0';
      ctx.after(450, () => {
        art.style.opacity = '';
        popIn(art, 500);
        ctx.sfx('sparkle');
      });
    }
  });
}
