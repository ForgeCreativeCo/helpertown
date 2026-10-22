import { Mama, Pops, type PopsPose } from '../art/characters';
import { cookieArt, crackedEggArt, decoArt, eggArt, fruitPieceArt, muffinArt, muffinTin, oven } from '../art/bakery';
import { ingredientArt, magnetArt } from '../art/kitchen';
import { bigMailbox, envelopeArt, letterTileArt, mailTruck, myMailbox, numberHouse, packageArt, postOfficeBuilding, stampArt } from '../art/post';
import { dinoArt, dinoBuilding, dirtClump, fossilArt, puzzlePieces } from '../art/dinos';
import { badgeArt, emergencyArt, flameArt, flamesHouse, rescueBuilding, splashArt } from '../art/rescue';
import { DINOS } from '../content/dinos';
import { tileColor } from '../content/letters';
import { EMERGENCIES } from '../content/rescue';
import type { StickerId } from '../content/stickers';
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
      // `?gallery=rescue`: emergencies, badges, flames, the house, and the building.
      // `?gallery=dino`: dinosaurs, fossils, a sand mound, puzzle pieces, and the building.
      const page = new URLSearchParams(location.search).get('gallery');
      if (page === 'rescue' || page === 'dino') {
        const put = (el: SVGGElement, t: string) => {
          el.setAttribute('transform', t);
          svg.append(el);
        };
        if (page === 'rescue') {
          EMERGENCIES.forEach((e, i) => put(emergencyArt(e.id), `translate(${20 + i * 310} 20) scale(0.9)`));
          ['star', 'rex', 'fireTruck', 'wrench'].forEach((id, i) => put(badgeArt(id as StickerId), `translate(${20 + i * 120} 260)`));
          put(flameArt(), 'translate(560 330)');
          put(splashArt(), 'translate(660 320)');
          put(flamesHouse().house, 'translate(760 260) scale(0.8)');
          put(rescueBuilding(), 'translate(40 400) scale(0.9)');
        } else {
          DINOS.forEach((d, i) => {
            put(dinoArt(d.id), `translate(${i * 230} 0) scale(0.75)`);
            put(fossilArt(d.id), `translate(${i * 230} 230) scale(0.75)`);
          });
          put(dirtClump(), 'translate(800 120)');
          const { frame, pieces } = puzzlePieces('hornDino', 4);
          put(frame, 'translate(900 260) scale(0.8)');
          pieces.forEach((p, i) => put(p.el, `translate(${700 + (i % 2) * 40} ${460 + Math.floor(i / 2) * 40}) scale(0.8)`));
          put(dinoBuilding(), 'translate(60 440) scale(0.75)');
        }
        ctx.root.append(svg);
        return;
      }
      // `?gallery=post`: envelopes, letter tiles, mailboxes, the truck, houses, a package, stamps, the building.
      if (new URLSearchParams(location.search).get('gallery') === 'post') {
        const put = (el: SVGGElement, t: string) => {
          el.setAttribute('transform', t);
          svg.append(el);
        };
        ['L', 'I', 'N', 'C'].forEach((l, i) => put(envelopeArt(l, tileColor(i)), `translate(${10 + i * 130} 0) scale(0.8)`));
        ['O', 'B', '7'].forEach((l, i) => put(letterTileArt(l, tileColor(i + 4)), `translate(${540 + i * 120} 0) scale(0.75)`));
        put(bigMailbox(0, 400), 'translate(900 -40) scale(0.7)');
        put(myMailbox(0, 300), 'translate(1080 20) scale(0.6)');
        put(mailTruck(), 'translate(20 160) scale(0.55)');
        [3, 4, 10].forEach((n, i) => put(numberHouse(n, ['#f7d774', '#f7a8cf', '#bfe7f7'][i]!, ['#d9534f', '#3d7fe0', '#3fae5a'][i]!), `translate(${300 + i * 170} 150) scale(0.65)`));
        put(packageArt(), 'translate(830 200)');
        ['star', 'rex', 'fireTruck'].forEach((id, i) => put(stampArt(id as StickerId), `translate(${20 + i * 110} 380)`));
        put(postOfficeBuilding(), 'translate(360 380) scale(0.9)');
        ctx.root.append(svg);
        return;
      }
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
