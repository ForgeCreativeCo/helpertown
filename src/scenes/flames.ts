import { Pops } from '../art/characters';
import { flameArt, flamesHouse, RESCUE_BACKDROP, splashArt } from '../art/rescue';
import { vehicleArt } from '../art/vehicles';
import { lineId } from '../content/lines';
import { bounce, fadeTo, finished, flyArc, placeAt, popIn } from '../core/anim';
import { addGlow } from '../core/glow';
import type { Scene, SceneContext } from '../core/scenes';
import { fromMarkup, s, stageSvg } from '../core/svg';
import { characterLife } from './common';
import { finishWithBadge } from './rescue';

const HOUSES = [3, 5];
const HOUSE = { x: 640, ground: 640, scale: 1 };
const NOZZLE = { x: 240, y: 520 };
const IDLE_MS = 7000;

/**
 * Fire Hose: a house has little flames in the windows and on the roof. Every
 * tap on a flame sprays it out while Pops counts. Two houses: 3 flames, then 5.
 */
export function flamesScene(): Scene {
  return {
    backdrop: RESCUE_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      svg.append(
        fromMarkup(`
          <rect x="-1280" y="-800" width="3840" height="1400" fill="#a9dcf5"/>
          <rect x="-1280" y="600" width="3840" height="60" fill="#7cc46b"/>
          <rect x="-1280" y="640" width="3840" height="1000" fill="#6b7480"/>`),
      );
      const pops = new Pops(-20, 300, 0.62);
      const truck = vehicleArt('fireTruck');
      const truckEl = s('g', { transform: 'translate(-70 456) scale(0.62)' }, [truck.body]);
      const stage = s('g');
      svg.append(pops.el, truckEl, stage);
      ctx.root.append(svg);
      characterLife(ctx, pops);
      void run(ctx, svg, pops, stage).catch((err) => {
        console.error(err);
        ctx.go('rescue');
      });
    },
  };
}

async function run(ctx: SceneContext, svg: SVGSVGElement, pops: Pops, stage: SVGGElement): Promise<void> {
  ctx.app.audio.preload(['rescue.flames', 'rescue.saved', 'rescue.badge', ...[1, 2, 3, 4, 5].map((n) => lineId('fixit.count', String(n)))]);
  await ctx.wait(400);

  for (const count of HOUSES) {
    const { house, spots } = flamesHouse();
    const houseEl = s('g', { transform: `translate(${HOUSE.x - 260 * HOUSE.scale} ${HOUSE.ground - 420 * HOUSE.scale}) scale(${HOUSE.scale})` }, [house]);
    stage.append(houseEl);
    popIn(house);
    const flames = spots.slice(0, count).map((p, i) => {
      const art = flameArt();
      const inner = s('g', { class: 'tf-bottom' }, [art]);
      const hit = s('circle', { cx: 0, cy: -10, r: 80, fill: 'transparent' });
      const el = s('g', {}, [hit, inner]);
      const at = { x: HOUSE.x - 260 + p.x, y: HOUSE.ground - 420 + p.y };
      placeAt(el, { x: at.x, y: at.y }, { x: 0, y: 0 });
      stage.append(el);
      // A gentle flicker, each a little out of step.
      ctx.keep(inner.animate([{ transform: 'scale(1, 1)' }, { transform: 'scale(0.92, 1.08)' }, { transform: 'scale(1, 1)' }], { duration: 900 + i * 120, iterations: Infinity }));
      return { el, inner, at, out: false };
    });
    await ctx.wait(500);
    pops.pose('pointing', flames[0]!.at);
    await ctx.speak('rescue.flames');
    pops.pose('idle');

    let put = 0;
    await new Promise<void>((resolve) => {
      let idle: (() => void) | null = null;
      let unglow: (() => void) | null = null;
      const armIdle = () => {
        idle?.();
        idle = ctx.after(IDLE_MS, () => {
          const next = flames.find((f) => !f.out);
          if (!next) return;
          unglow ??= addGlow(ctx, next.el, 0, -10, 90, 'halo');
          bounce(next.inner, 20);
          void ctx.speak('rescue.flames', { replaceQueued: true });
          armIdle();
        });
      };
      armIdle();
      for (const f of flames) {
        const off = ctx.tap(f.el, () => {
          if (f.out) return;
          f.out = true;
          off();
          unglow?.();
          unglow = null;
          put++;
          spray(ctx, svg, f.at);
          ctx.sfx('splash');
          void finished(fadeTo(f.inner, 1, 0, 350)).then(() => f.el.remove());
          void ctx.speak(lineId('fixit.count', String(put)), { replaceQueued: true });
          if (put === flames.length) {
            idle?.();
            resolve();
          } else armIdle();
        });
      }
    });

    await ctx.wait(700);
    ctx.sfx('sparkle');
    bounce(house, 20);
    pops.pose('cheering');
    await ctx.speak('rescue.saved');
    pops.pose('idle');
    await finished(fadeTo(houseEl, 1, 0, 300));
    stage.replaceChildren();
  }

  await finishWithBadge(ctx, 'flames', pops, svg);
}

/** A splash of water arcs from the hose to the flame. */
function spray(ctx: SceneContext, svg: SVGSVGElement, to: { x: number; y: number }): void {
  const drop = s('g', { class: 'no-hit' }, [splashArt()]);
  svg.append(drop);
  void ctx.guard(flyArc(drop, { x: NOZZLE.x, y: NOZZLE.y, scale: 0.6 }, { x: to.x, y: to.y, scale: 1.4 }, { x: 0, y: 0 }, 380, 160)).then(() =>
    finished(fadeTo(drop, 1, 0, 250)).then(() => drop.remove()),
  );
}
