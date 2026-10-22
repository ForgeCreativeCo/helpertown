import { Pops } from '../art/characters';
import { DINO_BACKDROP, dinoBack, puzzlePieces, sideDune } from '../art/dinos';
import { DINOS, getDino } from '../content/dinos';
import { lineId, PRAISE_LINES } from '../content/lines';
import { bounce, fadeTo, finished, flyArc, placeAt, popIn, type Place } from '../core/anim';
import { addGlow } from '../core/glow';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { characterLife, nextPraise } from './common';
import { finishDinoRound } from './dino';

/** Pieces per puzzle this visit: 2, then 3, then 4. */
const PUZZLES = [2, 3, 4];
const FRAME = { x: 500, y: 130, scale: 1 };
const IDLE_MS = 7000;
/** Where loose pieces wait, around the frame (clear of Pops on the left). */
const SPOTS: Place[] = [
  { x: 1050, y: 300, rot: 8 },
  { x: 370, y: 560, rot: -7 },
  { x: 1070, y: 590, rot: -6 },
  { x: 900, y: 560, rot: 6 },
];

/**
 * Dino Puzzle: a dinosaur in 2–4 pieces. Each tap sends a piece home to its
 * spot in the frame (nothing to get wrong); when it's whole, it says hello.
 */
export function puzzleScene(): Scene {
  return {
    backdrop: DINO_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const pops = new Pops(-10, 300, 0.62);
      const layer = s('g');
      svg.append(dinoBack(), pops.el, sideDune(), layer);
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
  ctx.app.audio.preload(['dino.puzzle', ...DINOS.map((d) => lineId('sticker.say', d.nameSticker)), ...PRAISE_LINES]);
  const startAt = Math.floor(Math.random() * DINOS.length);
  await ctx.wait(400);

  for (let n = 0; n < PUZZLES.length; n++) {
    const dino = DINOS[(startAt + n) % DINOS.length]!;
    const { frame, pieces } = puzzlePieces(dino.id, PUZZLES[n]!);
    const frameEl = s('g', { transform: `translate(${FRAME.x} ${FRAME.y}) scale(${FRAME.scale})` }, [frame]);
    layer.append(frameEl);
    popIn(frame);

    const loose = pieces.map((p, i) => {
      const origin = { x: p.rect.x + p.rect.w / 2, y: p.rect.y + p.rect.h / 2 };
      const home: Place = { x: FRAME.x + origin.x * FRAME.scale, y: FRAME.y + origin.y * FRAME.scale, scale: FRAME.scale };
      const spot: Place = { ...SPOTS[i]!, scale: FRAME.scale * 0.85 };
      const inner = s('g', { class: 'tf' }, [p.el]);
      const el = s('g', {}, [inner]);
      placeAt(el, spot, origin);
      layer.append(el);
      ctx.after(200 + i * 140, () => {
        popIn(inner);
        ctx.sfx('pop');
      });
      return { el, inner, origin, home, spot, done: false };
    });
    await ctx.wait(300 + loose.length * 140 + 300);
    if (n === 0) {
      pops.pose('pointing', loose[0]!.spot);
      await ctx.speak('dino.puzzle');
      pops.pose('idle');
    }

    let placed = 0;
    await new Promise<void>((resolve) => {
      let idle: (() => void) | null = null;
      let unglow: (() => void) | null = null;
      const armIdle = () => {
        idle?.();
        idle = ctx.after(IDLE_MS, () => {
          const next = loose.find((l) => !l.done);
          if (!next) return;
          unglow ??= addGlow(ctx, next.el, next.origin.x, next.origin.y, 120, 'halo');
          bounce(next.inner, 18);
          void ctx.speak('dino.puzzle', { replaceQueued: true });
          armIdle();
        });
      };
      armIdle();
      for (const l of loose) {
        const off = ctx.tap(l.el, () => {
          if (l.done) return;
          l.done = true;
          off();
          unglow?.();
          unglow = null;
          ctx.sfx('whoosh');
          // Home pieces sit under the loose ones so the rest stay easy to tap.
          void ctx.guard(flyArc(l.el, l.spot, l.home, l.origin, 500, 120)).then(() => {
            layer.insertBefore(l.el, frameEl.nextSibling);
            ctx.sfx('click');
            if (++placed === loose.length) {
              idle?.();
              resolve();
            }
          });
          armIdle();
        });
      }
    });

    // Whole again: it bounces and says its name.
    await ctx.wait(300);
    ctx.sfx('sparkle');
    bounce(frame, 24);
    for (const l of loose) bounce(l.inner, 24);
    pops.pose('cheering');
    await ctx.speak(lineId('sticker.say', getDino(dino.id).nameSticker));
    await ctx.speak(nextPraise());
    pops.pose('idle');
    await Promise.all([finished(fadeTo(frameEl, 1, 0, 300)), ...loose.map((l) => finished(fadeTo(l.el, 1, 0, 300)))]);
    layer.replaceChildren();
  }

  await finishDinoRound(ctx, 'puzzle', pops, svg);
}
