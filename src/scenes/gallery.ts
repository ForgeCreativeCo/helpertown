import { Mama, Pops, type PopsPose } from '../art/characters';
import { cookieArt, crackedEggArt, decoArt, eggArt, fruitPieceArt, muffinArt, muffinTin, oven } from '../art/bakery';
import { ingredientArt, magnetArt } from '../art/kitchen';
import { DECOS, FLAVORS } from '../content/bakery';
import { addProblem } from '../art/problems';
import { INGREDIENTS } from '../content/ingredients';
import { MAGNETS } from '../content/magnets';
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
      // `?gallery=baking`: icing decorations, muffins, a decorated cookie, eggs, fruit, the tin and oven.
      if (new URLSearchParams(location.search).get('gallery') === 'baking') {
        const at = (el: SVGGElement, x: number, y: number, scale = 1) => {
          const g = s('g', {}, [el]);
          placeAt(g, { x, y, scale }, { x: 50, y: 50 });
          svg.append(g);
        };
        DECOS.forEach((d, i) => at(decoArt(d.id), 70 + (i % 6) * 110, 70 + Math.floor(i / 6) * 110));
        FLAVORS.forEach((f, i) => {
          at(muffinArt(f.id), 70 + i * 110, 320);
          at(fruitPieceArt(f.id), 420 + i * 100, 320, 0.8);
        });
        at(cookieArt(['red-heart', 'blue-star', 'yellow-circle']), 760, 320, 1.4);
        at(eggArt(), 900, 320);
        at(crackedEggArt(), 1010, 320);
        const tin = muffinTin('blueberry', false);
        tin.setAttribute('transform', 'translate(60 440)');
        const baked = muffinTin('strawberry', true);
        baked.setAttribute('transform', 'translate(320 440)');
        const ov = oven();
        ov.glow.setAttribute('opacity', '0.8');
        ov.oven.setAttribute('transform', 'translate(-200 160) scale(0.8)');
        svg.append(tin, baked, ov.oven);
        ctx.root.append(svg);
        return;
      }
      // `?gallery=kitchen`: every ingredient (top) and fridge magnet (bottom).
      if (new URLSearchParams(location.search).get('gallery') === 'kitchen') {
        INGREDIENTS.forEach((ing, i) => {
          const g = s('g', {}, [ingredientArt(ing.id)]);
          placeAt(g, { x: 90 + i * 155, y: 200, scale: 0.9 }, { x: 80, y: 80 });
          svg.append(g);
        });
        MAGNETS.forEach((m, i) => {
          const g = s('g', {}, [magnetArt(m.id)]);
          placeAt(g, { x: 90 + i * 150, y: 470, scale: 1.2 }, { x: 50, y: 50 });
          svg.append(g);
        });
        ctx.root.append(svg);
        return;
      }
      // `?gallery=people`: every pose for Pops (top) and Mama (bottom).
      if (new URLSearchParams(location.search).get('gallery') === 'people') {
        const poses: PopsPose[] = ['idle', 'asking', 'pointing', 'thumbsUp', 'highFive', 'cheering', 'yawning', 'waving', 'holding'];
        poses.forEach((p, i) => {
          for (const [row, Who] of [Pops, Mama].entries()) {
            const c = new Who(10 + i * 140, 40 + row * 330, 0.42);
            c.pose(p, { x: 10 + i * 140 + 200, y: 300 + row * 330 });
            svg.append(c.el);
          }
        });
        ctx.root.append(svg);
        return;
      }
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
