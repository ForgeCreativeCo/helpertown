import { cloud, mamaHouse, townBackground, tree, workshopBuilding } from '../art/town';
import { vehicleArt } from '../art/vehicles';
import { breathe, wiggle } from '../core/anim';
import type { Scene, SceneContext } from '../core/scenes';
import { fromMarkup, hitGroup, s, stageSvg } from '../core/svg';
import { watchSession } from './common';

interface Place {
  lineId: string;
  sceneId: string;
  art: () => SVGGElement;
  box: { x: number; y: number; w: number; h: number };
}

/** Only places that exist are shown: no locked or "coming soon" buildings. */
const PLACES: Place[] = [
  { lineId: 'town.workshop', sceneId: 'hub', art: workshopBuilding, box: { x: 104, y: 186, w: 452, h: 380 } },
  { lineId: 'town.kitchen', sceneId: 'kitchen', art: mamaHouse, box: { x: 734, y: 200, w: 432, h: 366 } },
];

/** The town map: the home screen. Tap a place to go help there. */
export function townScene(): Scene {
  return {
    backdrop: '#7cc46b',
    mount(ctx) {
      const svg = stageSvg();
      const clouds = [cloud(60, 40, 1), cloud(560, 90, 0.8), cloud(980, 30, 0.9)];
      svg.append(townBackground(), ...clouds, tree(640, 560, 1), tree(-60, 560, 0.9), tree(1290, 560, 1));
      ctx.root.append(svg);
      clouds.forEach((c, i) =>
        ctx.keep(
          c.animate([{ transform: 'translateX(-60px)' }, { transform: 'translateX(60px)' }, { transform: 'translateX(-60px)' }], {
            duration: 24000 + i * 6000,
            iterations: Infinity,
            easing: 'ease-in-out',
          }),
        ),
      );

      PLACES.forEach((place, i) => {
        const art = place.art();
        art.setAttribute('class', 'tf-bottom');
        const g = hitGroup(art, place.box, 20);
        svg.append(g);
        ctx.keep(breathe(art, 0.02, 2600, i * 900));
        ctx.tap(g, () => {
          ctx.sfx('tap');
          wiggle(g);
          ctx.app.input.lock();
          ctx.onCleanup(() => ctx.app.input.unlock());
          const { x, y, w, h } = place.box;
          void ctx.speak(place.lineId, { replaceQueued: true }).then(() => ctx.go(place.sceneId, { from: { x: x + w / 2, y: y + h / 2 } }));
        });
      });

      chimneySmoke(ctx, svg);
      drivingTruck(ctx, svg);

      if (ctx.params.greet) ctx.after(300, () => void ctx.speak('town.hello'));
      // If the session is over, head into the workshop, where Pops says goodbye.
      watchSession(ctx, 4000, () => ctx.go('hub'));
    },
  };
}

/** Soft puffs drifting up from Mama's chimney. */
function chimneySmoke(ctx: SceneContext, svg: SVGSVGElement): void {
  for (let i = 0; i < 3; i++) {
    const puff = fromMarkup(`<circle cx="1074" cy="196" r="${14 + i * 3}" fill="#ffffff" opacity="0.85"/>`);
    puff.setAttribute('class', 'no-hit');
    svg.append(puff);
    ctx.keep(
      puff.animate(
        [
          { opacity: 0, transform: 'translate(0px, 0px) scale(0.6)' },
          { opacity: 0.9, transform: 'translate(6px, -30px) scale(1)', offset: 0.3 },
          { opacity: 0, transform: 'translate(22px, -110px) scale(1.5)' },
        ],
        { duration: 4200, delay: i * 1400, iterations: Infinity, easing: 'ease-out' },
      ),
    );
  }
}

/** A little dump truck that drives along the road now and then. */
function drivingTruck(ctx: SceneContext, svg: SVGSVGElement): void {
  const truck = vehicleArt('dumpTruck');
  const el = s('g', { class: 'no-hit' }, [truck.body]);
  svg.append(el);
  const y = 676 - 300 * 0.3;
  const duration = 14000;
  ctx.keep(
    el.animate([{ transform: `translate(-320px, ${y}px) scale(0.3)` }, { transform: `translate(1500px, ${y}px) scale(0.3)` }], {
      duration,
      iterations: Infinity,
      easing: 'linear',
    }),
  );
  for (const w of truck.spinners) ctx.keep(w.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 900, iterations: Infinity }));
}
