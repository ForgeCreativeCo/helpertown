import { Pops } from '../art/characters';
import { digPit, dinoArt, dirtClump, DINO_BACKDROP, fossilArt, sideDune } from '../art/dinos';
import { getDino } from '../content/dinos';
import { lineId } from '../content/lines';
import { bounce, fadeTo, finished, placeAt, popIn } from '../core/anim';
import { addGlow } from '../core/glow';
import { addFossil, nextFossil } from '../core/progress';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { characterLife } from './common';
import { finishDinoRound } from './dino';

const FOSSIL = { x: 690, y: 500, scale: 1.3 };
const IDLE_MS = 7000;
/** Sand mounds per dig: a quick one, then a longer one. */
const DIGS: { x: number; y: number; scale: number }[][] = [
  [
    { x: 560, y: 560, scale: 1.9 },
    { x: 800, y: 560, scale: 1.9 },
    { x: 720, y: 400, scale: 1.9 },
  ],
  [
    { x: 520, y: 600, scale: 1.5 },
    { x: 700, y: 610, scale: 1.5 },
    { x: 870, y: 580, scale: 1.5 },
    { x: 600, y: 440, scale: 1.5 },
    { x: 800, y: 410, scale: 1.5 },
  ],
];

/**
 * The Dig: a fossil is buried in the sand. Each tap brushes a mound away while
 * Pops counts; when it's all uncovered the dinosaur says hello and goes to
 * the museum. Two digs per visit.
 */
export function digScene(): Scene {
  return {
    backdrop: DINO_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const pops = new Pops(-10, 300, 0.62);
      const layer = s('g');
      svg.append(digPit(), pops.el, sideDune(), layer);
      ctx.root.append(svg);
      characterLife(ctx, pops);
      void run(ctx, svg, pops, layer).catch((err) => {
        console.error(err);
        ctx.go('dino');
      });
    },
  };
}

async function run(ctx: SceneContext, svg: SVGSVGElement, pops: Pops, layer: SVGGElement): Promise<void> {
  ctx.app.audio.preload([
    'dino.dig',
    'dino.museum',
    'letter.foundIt',
    ...[1, 2, 3, 4, 5].map((n) => lineId('fixit.count', String(n))),
    ...['rex', 'longNeck', 'hornDino'].map((id) => lineId('sticker.say', id)),
  ]);
  await ctx.wait(400);

  for (const mounds of DIGS) {
    const dino = nextFossil(ctx.progress);
    const fossil = s('g', { class: 'no-hit' }, [fossilArt(dino)]);
    placeAt(fossil, FOSSIL, { x: 150, y: 150 });
    layer.append(fossil);

    const clumps = mounds.map((m) => {
      const art = dirtClump();
      const inner = s('g', { class: 'tf' }, [art]);
      const hit = s('circle', { cx: 0, cy: 0, r: 80, fill: 'transparent' });
      const el = s('g', {}, [hit, inner]);
      placeAt(el, { x: m.x, y: m.y, scale: m.scale }, { x: 0, y: 0 });
      layer.append(el);
      popIn(inner);
      return { el, inner, done: false };
    });
    ctx.sfx('puff');
    await ctx.wait(400);
    pops.pose('pointing', { x: FOSSIL.x, y: FOSSIL.y });
    await ctx.speak('dino.dig');
    pops.pose('idle');

    let dug = 0;
    await new Promise<void>((resolve) => {
      let idle: (() => void) | null = null;
      let unglow: (() => void) | null = null;
      const armIdle = () => {
        idle?.();
        idle = ctx.after(IDLE_MS, () => {
          const next = clumps.find((c) => !c.done);
          if (!next) return;
          unglow ??= addGlow(ctx, next.el, 0, 0, 90, 'halo');
          bounce(next.inner, 16);
          void ctx.speak('dino.dig', { replaceQueued: true });
          armIdle();
        });
      };
      armIdle();
      for (const c of clumps) {
        const off = ctx.tap(c.el, () => {
          if (c.done) return;
          c.done = true;
          off();
          unglow?.();
          unglow = null;
          dug++;
          ctx.sfx('brush');
          c.inner.animate([{ transform: 'translate(0px, 0px) rotate(0deg)' }, { transform: 'translate(40px, -30px) rotate(20deg)' }], { duration: 350, fill: 'forwards' });
          void finished(fadeTo(c.el, 1, 0, 350)).then(() => c.el.remove());
          void ctx.speak(lineId('fixit.count', String(dug)), { replaceQueued: true });
          if (dug === clumps.length) {
            idle?.();
            resolve();
          } else armIdle();
        });
      }
    });

    // All uncovered: the fossil wakes up as the real dinosaur for a moment.
    await ctx.wait(600);
    ctx.sfx('sparkle');
    bounce(fossil.firstElementChild as SVGGElement, 30);
    const alive = s('g', { class: 'no-hit' }, [dinoArt(dino)]);
    placeAt(alive, FOSSIL, { x: 150, y: 150 });
    layer.append(alive);
    fadeTo(alive, 0, 1, 400);
    bounce(alive.firstElementChild as SVGGElement, 40);
    pops.pose('cheering');
    await ctx.speak(lineId('sticker.say', getDino(dino).nameSticker));
    await ctx.speak('letter.foundIt');
    await finished(fadeTo(alive, 1, 0, 300));
    alive.remove();
    pops.pose('thumbsUp');
    addFossil(ctx.progress, dino);
    ctx.save();
    await ctx.speak('dino.museum');
    // Off it goes to the museum.
    ctx.sfx('whoosh');
    await finished(
      fossil.animate(
        [
          { transform: `translate(${FOSSIL.x}px, ${FOSSIL.y}px) scale(${FOSSIL.scale}) translate(-150px, -150px)` },
          { transform: `translate(1100px, -200px) scale(0.3) translate(-150px, -150px)` },
        ],
        { duration: 700, easing: 'ease-in', fill: 'forwards' },
      ),
    );
    pops.pose('idle');
    layer.replaceChildren();
  }

  await finishDinoRound(ctx, 'dig', pops, svg, { newFossil: true });
}
