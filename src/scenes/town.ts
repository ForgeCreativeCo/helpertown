import { postOfficeBuilding } from '../art/post';
import { cloud, mamaHouse, townBackground, tree, workshopBuilding } from '../art/town';
import { vehicleArt } from '../art/vehicles';
import { wiggle } from '../core/anim';
import type { Scene, SceneContext } from '../core/scenes';
import { fromMarkup, hitGroup, s, stageSvg } from '../core/svg';
import { takeTurnsHopping, watchSession } from './common';

const SCALE = 0.74;
const GROUND = 566;

interface Place {
  lineId: string;
  sceneId: string;
  art: () => SVGGElement;
  /** Where the art is drawn: its left edge, top and ground line in its own coordinates. */
  src: { left: number; top: number; ground: number; width: number };
  /** Left edge on the street. */
  left: number;
  /** The door's x in the art's own coordinates (for the front path). */
  door: number;
}

/** Only places that exist are shown: no locked or "coming soon" buildings. */
const PLACES: Place[] = [
  { lineId: 'town.workshop', sceneId: 'hub', art: workshopBuilding, src: { left: 104, top: 186, ground: 566, width: 452 }, left: 30, door: 330 },
  { lineId: 'town.kitchen', sceneId: 'kitchen', art: mamaHouse, src: { left: 734, top: 196, ground: 566, width: 432 }, left: 445, door: 950 },
  { lineId: 'town.postOffice', sceneId: 'post', art: postOfficeBuilding, src: { left: 0, top: 20, ground: 380, width: 460 }, left: 850, door: 230 },
];

/** Maps a point in a place's own art coordinates onto the street. */
function onStreet(p: Place, x: number, y: number): { x: number; y: number } {
  return { x: p.left + (x - p.src.left) * SCALE, y: GROUND + (y - p.src.ground) * SCALE };
}

/** The town map: the home screen. Tap a place to go help there. */
export function townScene(): Scene {
  return {
    backdrop: '#7cc46b',
    mount(ctx) {
      const svg = stageSvg();
      const clouds = [cloud(60, 40, 1), cloud(560, 90, 0.8), cloud(980, 30, 0.9)];
      const doors = PLACES.map((p) => onStreet(p, p.door, p.src.ground).x);
      svg.append(townBackground(doors), ...clouds, tree(405, 560, 0.85), tree(818, 560, 0.85), tree(-40, 560, 0.9), tree(1290, 560, 1));
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

      const arts: SVGGElement[] = [];
      for (const place of PLACES) {
        // The building hops (inner group); its position on the street stays put (outer group).
        const art = place.art();
        art.setAttribute('class', 'tf-bottom');
        const positioned = s('g', { transform: `translate(${place.left - place.src.left * SCALE} ${GROUND - place.src.ground * SCALE}) scale(${SCALE})` }, [art]);
        const topLeft = onStreet(place, place.src.left, place.src.top);
        const box = { x: topLeft.x, y: topLeft.y, w: place.src.width * SCALE, h: GROUND - topLeft.y };
        const g = hitGroup(positioned, box, 16);
        svg.append(g);
        arts.push(art);
        ctx.tap(g, () => {
          ctx.sfx('tap');
          wiggle(art);
          ctx.app.input.lock();
          ctx.onCleanup(() => ctx.app.input.unlock());
          void ctx.speak(place.lineId, { replaceQueued: true }).then(() => ctx.go(place.sceneId, { from: { x: box.x + box.w / 2, y: box.y + box.h / 2 } }));
        });
      }

      takeTurnsHopping(ctx, arts, 3000);
      chimneySmoke(ctx, svg, onStreet(PLACES[1]!, 1074, 200));
      drivingTruck(ctx, svg);

      if (ctx.params.greet) ctx.after(300, () => void ctx.speak('town.hello'));
      // If the session is over, head into the workshop, where Pops says goodbye.
      watchSession(ctx, 4000, () => ctx.go('hub'));
    },
  };
}

/** Soft puffs drifting up from Mama's chimney. */
function chimneySmoke(ctx: SceneContext, svg: SVGSVGElement, at: { x: number; y: number }): void {
  for (let i = 0; i < 3; i++) {
    const puff = fromMarkup(`<circle cx="${at.x}" cy="${at.y}" r="${11 + i * 2}" fill="#ffffff" opacity="0.85"/>`);
    puff.setAttribute('class', 'no-hit');
    svg.append(puff);
    ctx.keep(
      puff.animate(
        [
          { opacity: 0, transform: 'translate(0px, 0px) scale(0.6)' },
          { opacity: 0.9, transform: 'translate(5px, -24px) scale(1)', offset: 0.3 },
          { opacity: 0, transform: 'translate(18px, -90px) scale(1.5)' },
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
  ctx.keep(
    el.animate([{ transform: `translate(-320px, ${y}px) scale(0.3)` }, { transform: `translate(1500px, ${y}px) scale(0.3)` }], {
      duration: 14000,
      iterations: Infinity,
      easing: 'linear',
    }),
  );
  for (const w of truck.spinners) ctx.keep(w.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 900, iterations: Infinity }));
}
