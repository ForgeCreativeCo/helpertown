import { Pops } from '../art/characters';
import { BED, CONSTRUCTION_BACKDROP, dirtPile, dirtScoop, sideBarrier, siteBack } from '../art/construction';
import { vehicleArt, VEHICLE_H, type VehicleArt } from '../art/vehicles';
import { lineId } from '../content/lines';
import { bounce, finished, flyArc, placeAt } from '../core/anim';
import { addGlow } from '../core/glow';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { characterLife } from './common';
import { finishWithSticker } from './construction';

const GROUND = 706;
const DIGGER = { left: 400, scale: 0.85 };
const TRUCK = { left: 880, scale: 0.62 };
const PILE = { x: 360, y: GROUND, scale: 0.55 };
/** Scoops per truck: three trucks fill up each visit. */
const LOADS = [3, 4, 5];
const IDLE_MS = 7000;

/**
 * Excavator Scoops: every tap on the excavator scoops dirt from the pile into
 * the dump truck while Pops counts. When it's full it drives off and the next
 * truck rolls in.
 */
export function scoopsScene(): Scene {
  return {
    backdrop: CONSTRUCTION_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const pops = new Pops(-10, 300, 0.62);
      const pile = dirtPile(PILE.scale);
      pile.setAttribute('transform', `translate(${PILE.x} ${PILE.y})`);
      const digger = vehicleArt('excavator');
      const hit = s('rect', { x: -20, y: -40, width: 520, height: 360, rx: 40, fill: 'transparent' });
      const diggerEl = s('g', { transform: `translate(${DIGGER.left} ${GROUND - VEHICLE_H * DIGGER.scale}) scale(${DIGGER.scale})` }, [hit, digger.body]);
      const trucks = s('g');
      svg.append(siteBack(), pops.el, sideBarrier(), pile, trucks, diggerEl);
      ctx.root.append(svg);
      characterLife(ctx, pops);
      void run(ctx, svg, pops, digger, diggerEl, trucks).catch((err) => {
        console.error(err);
        ctx.go('construction');
      });
    },
  };
}

function truckAt(art: VehicleArt): SVGGElement {
  return s('g', { transform: `translate(${TRUCK.left} ${GROUND - VEHICLE_H * TRUCK.scale}) scale(${TRUCK.scale})` }, [art.body]);
}

async function run(
  ctx: SceneContext,
  svg: SVGSVGElement,
  pops: Pops,
  digger: VehicleArt,
  diggerEl: SVGGElement,
  trucks: SVGGElement,
): Promise<void> {
  ctx.app.audio.preload(['build.scoop', 'build.full', 'round.sticker', ...[1, 2, 3, 4, 5].map((n) => lineId('fixit.count', String(n)))]);
  const bed = { x: TRUCK.left + BED.x * TRUCK.scale, y: GROUND - VEHICLE_H * TRUCK.scale + BED.y * TRUCK.scale };
  const pileTop = { x: PILE.x, y: PILE.y - 60 };
  await ctx.wait(400);

  for (let t = 0; t < LOADS.length; t++) {
    const need = LOADS[t]!;
    // A truck rolls in from the right.
    const truck = vehicleArt('dumpTruck');
    const truckEl = truckAt(truck);
    trucks.append(truckEl);
    ctx.sfx('vroom');
    await finished(truck.body.animate([{ transform: 'translateX(900px)' }, { transform: 'translateX(0px)' }], { duration: 900, easing: 'ease-out' }));
    const load = s('g', { class: 'no-hit' });
    trucks.append(load);

    if (t === 0) {
      pops.pose('pointing', { x: 600, y: 560 });
      await ctx.speak('build.scoop');
      pops.pose('idle');
    }

    let scooped = 0;
    await new Promise<void>((resolve) => {
      let idle: (() => void) | null = null;
      let unglow: (() => void) | null = null;
      let busy = false;
      const armIdle = () => {
        idle?.();
        idle = ctx.after(IDLE_MS, () => {
          unglow ??= addGlow(ctx, diggerEl, 240, 150, 260, 'halo');
          bounce(digger.body, 16);
          void ctx.speak('build.scoop', { replaceQueued: true });
          armIdle();
        });
      };
      armIdle();
      const off = ctx.tap(diggerEl, () => {
        // One scoop at a time, so mashing can't skip the count.
        if (busy) return;
        busy = true;
        unglow?.();
        unglow = null;
        scooped++;
        const n = scooped;
        digger.testPart();
        ctx.sfx('whirr');
        const dirt = s('g', {}, [dirtScoop()]);
        placeAt(dirt, pileTop, { x: 0, y: 0 });
        svg.append(dirt);
        void ctx.guard(flyArc(dirt, pileTop, { x: bed.x + (n % 2 ? -14 : 14), y: bed.y - n * 6, scale: 0.9 }, { x: 0, y: 0 }, 600, 220)).then(() => {
          ctx.sfx('plop');
          load.append(dirt);
          bounce(truck.body, 10);
          busy = false;
        });
        void ctx.speak(lineId('fixit.count', String(n)), { replaceQueued: true });
        if (n === need) {
          idle?.();
          off();
          ctx.after(700, resolve);
        } else armIdle();
      });
    });

    // Full: Pops cheers and the truck drives off with its load.
    await ctx.wait(400);
    pops.pose('thumbsUp');
    await ctx.speak('build.full');
    ctx.sfx('honk');
    const away = { duration: 1100, easing: 'ease-in', fill: 'forwards' } as const;
    void finished(load.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(900px)' }], away));
    await finished(truck.body.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(900px)' }], away));
    pops.pose('idle');
    trucks.replaceChildren();
  }

  await finishWithSticker(ctx, 'scoops', pops, svg);
}
