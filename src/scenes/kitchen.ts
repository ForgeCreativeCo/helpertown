import { Mama } from '../art/characters';
import { bakeItemArt, bakeryShelfArt, cookieTray, HUB_SHELF_SLOTS } from '../art/bakery';
import { fridge, KITCHEN_BACKDROP, kitchenBack, kitchenCounter, MAGNET_SLOTS, magnetArt, mixingBowl, plant, teapot, windowShade } from '../art/kitchen';
import { townButton } from '../art/town';
import { lineId } from '../content/lines';
import type { MagnetId } from '../content/magnets';
import { bounce, placeAt, popIn, sway, wiggle } from '../core/anim';
import type { Scene, SceneContext } from '../core/scenes';
import { fromMarkup, hitGroup, s, stageSvg } from '../core/svg';
import { characterLife, navButton, takeTurnsHopping, watchSession, windDown } from './common';

/** The mixing bowl on the counter, with a spoon sticking out. */
function bowlOnCounter(): SVGGElement {
  const g = mixingBowl(200, 492);
  g.prepend(...Array.from(fromMarkup('<path d="M236 470 L276 386" stroke="#2b1d14" stroke-width="18" stroke-linecap="round"/><path d="M236 470 L276 386" stroke="#d9a066" stroke-width="9" stroke-linecap="round"/>').childNodes));
  return g;
}

/**
 * Mama's Kitchen hub. The fridge opens the ingredient game, the mixing bowl
 * Bake Together, the cookie tray Decorate Cookies, and the shelf his bakery.
 */
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
      // The teapot lives on top of the fridge, steaming away.
      const pot = teapot();
      const potHolder = s('g', { transform: 'translate(300 -398)', class: 'no-hit' }, [pot.pot, ...pot.steam]);
      svg.append(mama.el, kitchenCounter());
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

      // Four things to tap, each opening a game or his collection.
      const spots: { art: SVGGElement; box: { x: number; y: number; w: number; h: number }; line: string; scene: string; pad?: number }[] = [
        { art: fridge(), box: { x: 980, y: 120, w: 250, h: 580 }, line: 'kitchen.fridge', scene: 'cook' },
        { art: bowlOnCounter(), box: { x: 100, y: 430, w: 200, h: 110 }, line: 'kitchen.bowl', scene: 'bake', pad: 34 },
        { art: cookieTray(), box: { x: 712, y: 440, w: 236, h: 82 }, line: 'kitchen.cookies', scene: 'decorate', pad: 34 },
        { art: bakeryShelfArt(), box: { x: 166, y: 56, w: 262, h: 196 }, line: 'kitchen.shelf', scene: 'bakery' },
      ];
      const arts: SVGGElement[] = [];
      for (const spot of spots) {
        spot.art.setAttribute('class', 'tf-bottom');
        const el = hitGroup(spot.art, spot.box, spot.pad ?? 20);
        svg.append(el);
        arts.push(spot.art);
        ctx.tap(el, () => {
          ctx.sfx('tap');
          wiggle(el);
          ctx.app.input.lock();
          ctx.onCleanup(() => ctx.app.input.unlock());
          const { x, y, w, h } = spot.box;
          void ctx.speak(spot.line, { replaceQueued: true }).then(() => ctx.go(spot.scene, { from: { x: x + w / 2, y: y + h / 2 } }));
        });
      }
      svg.append(potHolder);
      takeTurnsHopping(ctx, arts);

      // The newest things he made, on the shelf (the shelf itself is the tap target).
      const shelfItems = s('g', { class: 'no-hit' });
      svg.append(shelfItems);
      ctx.progress.bakery.slice(-HUB_SHELF_SLOTS.length).forEach((item, i, shown) => {
        const g = s('g', {}, [bakeItemArt(item)]);
        const slot = HUB_SHELF_SLOTS[i]!;
        placeAt(g, { x: slot.x, y: slot.y, scale: 0.68 }, { x: 50, y: 50 });
        shelfItems.append(g);
        if (ctx.params.newBake && i === shown.length - 1) {
          g.firstElementChild!.setAttribute('class', 'tf');
          ctx.after(450, () => {
            popIn(g.firstElementChild as SVGGElement, 500);
            ctx.sfx('sparkle');
          });
        }
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
