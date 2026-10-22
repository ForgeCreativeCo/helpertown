import { Pops, type Character } from '../art/characters';
import { CONSTRUCTION_BACKDROP, siteBack, tileTable } from '../art/construction';
import { INK } from '../art/palette';
import { townButton } from '../art/town';
import { vehicleArt, VEHICLE_H, VEHICLE_W } from '../art/vehicles';
import { lineId } from '../content/lines';
import { bounce, wiggle } from '../core/anim';
import { awardSticker, recordRound } from '../core/progress';
import type { Scene, SceneContext } from '../core/scenes';
import type { ActivityId } from '../core/storage';
import { fromMarkup, hitGroup, s, stageSvg } from '../core/svg';
import { characterLife, navButton, takeTurnsHopping, watchSession, windDown } from './common';

const GROUND = 706;
const TRUCK_SCALE = 0.72;

/** End of a Construction Site round: a sticker for his toolbox, a celebration, back to the site. */
export async function finishWithSticker(ctx: SceneContext, activity: ActivityId, host: Character, svg: SVGSVGElement): Promise<void> {
  recordRound(ctx.progress, activity);
  const sticker = awardSticker(ctx.progress);
  ctx.save();
  await ctx.celebrate({ pops: host, svg, sticker, flyTo: { x: 640, y: 900 } });
  ctx.go('construction');
}

/**
 * The Construction Site: the dump truck opens Rock Sorting, the excavator
 * opens Excavator Scoops, and the tile table Pops stands behind opens Tile Tower.
 */
export function constructionScene(): Scene {
  return {
    backdrop: CONSTRUCTION_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      svg.append(siteBack());
      ctx.root.append(svg);

      const pops = new Pops(480, 150, 0.8);
      svg.append(pops.el);
      characterLife(ctx, pops);

      const truck = (id: 'dumpTruck' | 'excavator', left: number) =>
        s('g', { transform: `translate(${left} ${GROUND - VEHICLE_H * TRUCK_SCALE}) scale(${TRUCK_SCALE})` }, [vehicleArt(id).body]);
      const spots = [
        { art: truck('dumpTruck', 30), box: { x: 30, y: 480, w: VEHICLE_W * TRUCK_SCALE, h: 226 }, line: lineId('garage.name', 'dumpTruck'), scene: 'sort' },
        { art: tileTable(), box: { x: 430, y: 470, w: 420, h: 240 }, line: 'build.tilesSpot', scene: 'build' },
        { art: truck('excavator', 880), box: { x: 870, y: 440, w: 370, h: 266 }, line: lineId('garage.name', 'excavator'), scene: 'scoops' },
      ];
      const arts: SVGGElement[] = [];
      for (const spot of spots) {
        const inner = s('g', { class: 'tf-bottom' }, [spot.art]);
        const el = hitGroup(inner, spot.box, 20);
        svg.append(el);
        arts.push(inner);
        ctx.tap(el, () => {
          ctx.sfx(spot.scene === 'build' ? 'click' : 'honk');
          wiggle(inner);
          ctx.app.input.lock();
          ctx.onCleanup(() => ctx.app.input.unlock());
          const { x, y, w, h } = spot.box;
          void ctx.speak(spot.line, { replaceQueued: true }).then(() => ctx.go(spot.scene, { from: { x: x + w / 2, y: y + h / 2 } }));
        });
      }
      takeTurnsHopping(ctx, arts);

      let line = 0;
      ctx.tap(pops.el, () => {
        bounce(pops.body, 24);
        ctx.sfx('boing');
        pops.pose(line % 2 === 0 ? 'waving' : 'thumbsUp');
        ctx.after(1400, () => pops.pose('idle'));
        void ctx.speak(line++ % 2 === 0 ? 'pops.hello' : 'pops.giggle', { replaceQueued: true });
      });

      navButton(ctx, svg, townButton(96, 92), 96, 92, 'nav.town', 'town');
      if (ctx.params.greet) ctx.after(250, () => void ctx.speak('build.hello'));

      // When the session is over: Pops yawns, waves, and a tarp comes down over the tile table.
      watchSession(ctx, ctx.params.greet ? 4000 : 900, () => {
        const tarp = fromMarkup(`<rect x="420" y="440" width="440" height="280" rx="20" fill="#3d7fe0" stroke="${INK}" stroke-width="8" opacity="0.95"/>`);
        tarp.style.transformOrigin = '640px 440px';
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
