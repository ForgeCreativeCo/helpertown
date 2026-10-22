import { Pops, type PopsPose } from '../art/pops';
import { addProblem } from '../art/problems';
import { vehicleArt } from '../art/vehicles';
import { PROBLEMS } from '../content/problems';
import { VEHICLES } from '../content/vehicles';
import { stickerArt } from '../art/stickers';
import { toolArt } from '../art/tools';
import { STICKERS } from '../content/stickers';
import { TOOLS } from '../content/tools';
import { placeAt } from '../core/anim';
import type { Scene } from '../core/scenes';
import { s, stageSvg } from '../core/svg';

/** Dev-only art sheet (`?gallery`): every Pops pose, tool and sticker. */
export function galleryScene(): Scene {
  return {
    backdrop: '#efe3cf',
    mount(ctx) {
      const svg = stageSvg();
      svg.append(s('rect', { x: -1280, y: -800, width: 3840, height: 2400, fill: '#efe3cf' }));
      // `?gallery=vehicles`: every vehicle, clean (top) and with a problem (bottom).
      if (new URLSearchParams(location.search).get('gallery') === 'vehicles') {
        const problems = PROBLEMS.map((p) => p.id);
        VEHICLES.forEach((v, i) => {
          const clean = vehicleArt(v.id);
          svg.append(s('g', { transform: `translate(${20 + (i % 4) * 310} ${10 + Math.floor(i / 4) * 190}) scale(0.6)` }, [clean.body]));
          const broken = vehicleArt(v.id);
          const problem = problems.filter((p) => v.wheeled || (p !== 'flatTire' && p !== 'looseWheel'))[i % 5]!;
          addProblem(broken, problem);
          svg.append(s('g', { transform: `translate(${20 + (i % 4) * 310} ${420 + Math.floor(i / 4) * 190}) scale(0.6)` }, [broken.body]));
        });
        ctx.root.append(svg);
        return;
      }
      const poses: PopsPose[] = ['idle', 'asking', 'pointing', 'thumbsUp', 'highFive', 'cheering', 'yawning', 'waving', 'holding'];
      poses.forEach((p, i) => {
        const pops = new Pops(10 + i * 140, 0, 0.42);
        pops.pose(p, { x: 10 + i * 140 + 200, y: 260 });
        svg.append(pops.el);
      });
      TOOLS.forEach((t, i) => {
        const g = s('g', {}, [toolArt(t.id)]);
        placeAt(g, { x: 100 + i * 180, y: 360, scale: 0.9 }, { x: 80, y: 80 });
        svg.append(g);
      });
      STICKERS.forEach((st, i) => {
        const g = s('g', {}, [stickerArt(st.id)]);
        placeAt(g, { x: 80 + i * 124, y: 560 }, { x: 50, y: 50 });
        svg.append(g);
      });
      ctx.root.append(svg);
    },
  };
}
