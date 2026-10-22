import { Pops } from '../art/characters';
import { dinoArt, DINO_BACKDROP, dinoBack, sideDune } from '../art/dinos';
import { DINOS, type DinoId } from '../content/dinos';
import { PRAISE_LINES } from '../content/lines';
import { bounce, fadeTo, finished, popIn } from '../core/anim';
import { askQuestion, type Choice } from '../core/question';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { characterLife, nextPraise } from './common';
import { finishDinoRound } from './dino';

const TRACK = 'sizes.choices';
const QUESTIONS = 4;
const GROUND = 690;
const ROW = { left: 300, right: 1250 };
type Size = 'big' | 'little' | 'middle';
const SCALE: Record<Size, number> = { big: 1.1, middle: 0.72, little: 0.42 };

/**
 * Big and Little: two (later three) of the same dinosaur in different sizes.
 * "Find the big dinosaur!" / "Find the little dinosaur!"
 */
export function sizesScene(): Scene {
  return {
    backdrop: DINO_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const pops = new Pops(-10, 300, 0.62);
      const row = s('g');
      svg.append(dinoBack(), pops.el, sideDune(), row);
      ctx.root.append(svg);
      characterLife(ctx, pops);
      void run(ctx, svg, pops, row).catch((err) => {
        console.error(err);
        ctx.go('dino');
      });
    },
  };
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

async function run(ctx: SceneContext, svg: SVGSVGElement, pops: Pops, row: SVGGElement): Promise<void> {
  ctx.difficulty.startRound(TRACK, 2, 3);
  ctx.app.audio.preload(['dino.big', 'dino.little', 'dino.thatsBig', 'dino.thatsLittle', ...PRAISE_LINES]);
  // Big and little take turns, starting with either.
  const first: Size = Math.random() < 0.5 ? 'big' : 'little';
  await ctx.wait(450);

  for (let q = 0; q < QUESTIONS; q++) {
    const dino: DinoId = DINOS[(q + Math.floor(Math.random() * DINOS.length)) % DINOS.length]!.id;
    const target: Size = q % 2 === 0 ? first : first === 'big' ? 'little' : 'big';
    const sizes = shuffled<Size>(ctx.difficulty.choices(TRACK) >= 3 ? ['big', 'middle', 'little'] : ['big', 'little']);
    const step = (ROW.right - ROW.left) / sizes.length;
    const built = sizes.map((size, i) => {
      const scale = SCALE[size];
      const art = dinoArt(dino);
      art.setAttribute('class', 'tf-bottom');
      // Generous tap area so even the little one is easy to hit.
      const hit = s('rect', { x: -60, y: 20, width: 420, height: 280, fill: 'transparent' });
      const cx = ROW.left + step * (i + 0.5);
      const el = s('g', { transform: `translate(${cx - 150 * scale} ${GROUND - 252 * scale}) scale(${scale})` }, [hit, art]);
      row.append(el);
      ctx.after(i * 140, () => {
        popIn(art);
        ctx.sfx('pop');
      });
      return { size, el, art, cx, scale };
    });
    await ctx.wait(sizes.length * 140 + 400);

    const choices: Choice[] = built.map((b) => ({
      el: b.el,
      art: b.art,
      correct: b.size === target,
      nameLine: b.size === 'big' ? 'dino.thatsBig' : b.size === 'little' ? 'dino.thatsLittle' : undefined,
      glow: { cx: 150, cy: 160, r: 170 },
      center: { x: b.cx, y: GROUND - 140 * b.scale },
    }));
    const result = await askQuestion(ctx, { promptLine: target === 'big' ? 'dino.big' : 'dino.little', choices, pops, svg });
    ctx.difficulty.record(TRACK, 2, 3, result.firstTry);

    const chosen = built.find((b) => b.size === target)!;
    for (const b of built) if (b !== chosen) void finished(fadeTo(b.el, 1, 0, 250));
    ctx.sfx(target === 'big' ? 'boing' : 'pop');
    bounce(chosen.art, 40);
    pops.pose('thumbsUp');
    await ctx.speak(target === 'big' ? 'dino.thatsBig' : 'dino.thatsLittle');
    if (q % 2 === 1) await ctx.speak(nextPraise());
    pops.pose('idle');
    await finished(fadeTo(chosen.el, 1, 0, 250));
    row.replaceChildren();
  }

  await finishDinoRound(ctx, 'sizes', pops, svg);
}
