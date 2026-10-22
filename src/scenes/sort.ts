import { Pops } from '../art/characters';
import { BED, colorTruck, CONSTRUCTION_BACKDROP, rockArt, sideBarrier, siteBack } from '../art/construction';
import { VEHICLE_H, VEHICLE_W } from '../art/vehicles';
import { ROCK_COLORS, type RockColor } from '../content/construction';
import { lineId, PRAISE_LINES } from '../content/lines';
import { bounce, fadeTo, finished, flyArc, placeAt, popIn } from '../core/anim';
import { askQuestion, type Choice } from '../core/question';
import { nextTarget, pickChoices } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { characterLife, nextPraise } from './common';
import { finishWithSticker } from './construction';

const TRACK = 'sort.choices';
const QUESTIONS = 4;
const GROUND = 712;
const ROW = { left: 300, right: 1250 };
const ROCK_AT = { x: 700, y: 250 };
const COLORS = ROCK_COLORS.map((r) => r.id);

/**
 * Rock Sorting: a colored rock comes down from the crane. "Put the red rock in
 * the red truck!" He taps the truck of the same color and the rock drops in.
 */
export function sortScene(): Scene {
  return {
    backdrop: CONSTRUCTION_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const pops = new Pops(-10, 300, 0.62);
      const row = s('g');
      svg.append(siteBack(), pops.el, sideBarrier(), row);
      ctx.root.append(svg);
      characterLife(ctx, pops);
      void run(ctx, svg, pops, row).catch((err) => {
        console.error(err);
        ctx.go('construction');
      });
    },
  };
}

async function run(ctx: SceneContext, svg: SVGSVGElement, pops: Pops, row: SVGGElement): Promise<void> {
  ctx.difficulty.startRound(TRACK, 2, 4);
  ctx.app.audio.preload([...COLORS.flatMap((c) => [lineId('build.sort', c), lineId('build.thatsTruck', c)]), ...PRAISE_LINES, 'round.sticker']);
  const asked: RockColor[] = [];
  await ctx.wait(450);

  for (let q = 0; q < QUESTIONS; q++) {
    const target = nextTarget(COLORS, asked);
    asked.push(target);
    const ids = pickChoices(target, COLORS, ctx.difficulty.choices(TRACK));
    const scale = ids.length > 3 ? 0.44 : 0.52;
    const step = (ROW.right - ROW.left) / ids.length;
    const built = ids.map((id, i) => {
      const art = colorTruck(id);
      const hit = s('rect', { x: -20, y: -30, width: VEHICLE_W + 40, height: VEHICLE_H + 50, rx: 40, fill: 'transparent' });
      const cx = ROW.left + step * (i + 0.5);
      const left = cx - (VEHICLE_W * scale) / 2;
      const top = GROUND - VEHICLE_H * scale;
      const el = s('g', { transform: `translate(${left} ${top}) scale(${scale})` }, [hit, art.body]);
      row.append(el);
      ctx.after(i * 120, () => popIn(art.body));
      return { id, el, art, cx, scale, bed: { x: left + BED.x * scale, y: top + BED.y * scale } };
    });
    ctx.sfx('vroom');

    // The rock swings down from the crane.
    const rock = s('g', { class: 'no-hit' }, [rockArt(target)]);
    placeAt(rock, { x: ROCK_AT.x, y: -120 }, { x: 0, y: 0 });
    svg.append(rock);
    await ctx.guard(flyArc(rock, { x: ROCK_AT.x, y: -120 }, ROCK_AT, { x: 0, y: 0 }, 700, 0));
    ctx.sfx('pop');
    await ctx.wait(ids.length * 120);

    const choices: Choice[] = built.map((b) => ({
      el: b.el,
      art: b.art.body,
      correct: b.id === target,
      nameLine: lineId('build.thatsTruck', b.id),
      glow: { cx: VEHICLE_W / 2, cy: VEHICLE_H / 2, r: 260 },
      center: { x: b.cx, y: GROUND - (VEHICLE_H * b.scale) / 2 },
    }));
    const result = await askQuestion(ctx, { promptLine: lineId('build.sort', target), choices, pops, svg });
    ctx.difficulty.record(TRACK, 2, 4, result.firstTry);

    // Into the bed it goes: clunk, the truck bounces, and Pops says thanks.
    const chosen = built.find((b) => b.id === target)!;
    for (const b of built) if (b !== chosen) void finished(fadeTo(b.el, 1, 0, 250));
    ctx.sfx('whoosh');
    await ctx.guard(flyArc(rock, ROCK_AT, { x: chosen.bed.x, y: chosen.bed.y, scale: chosen.scale * 1.6 }, { x: 0, y: 0 }, 650, 140));
    ctx.sfx('bang');
    bounce(chosen.art.body, 22);
    pops.pose('thumbsUp');
    await ctx.speak(nextPraise());
    pops.pose('idle');
    ctx.sfx('honk');
    await Promise.all([finished(fadeTo(chosen.el, 1, 0, 300)), finished(fadeTo(rock, 1, 0, 300))]);
    rock.remove();
    row.replaceChildren();
  }

  await finishWithSticker(ctx, 'sort', pops, svg);
}
