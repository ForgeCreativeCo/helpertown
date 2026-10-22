import { Pops } from '../art/pops';
import { benchScene, FLOOR } from '../art/workshop';
import { lineId, PRAISE_LINES } from '../content/lines';
import { getTool, type ToolId } from '../content/tools';
import { bounce, fadeTo, finished, flyArc, wiggle, type Place } from '../core/anim';
import { awardSticker, maybeIntroduceTool, recordRound, recordToolAnswer, toolPool } from '../core/progress';
import { askQuestion } from '../core/question';
import { nextTarget, pickChoices } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { popsLife } from './common';
import { makePieces, showPieces, TOOL_ORIGIN, toolChoices, type Row, type ToolPiece } from './toolPieces';

const QUESTIONS = 4;
const TRACK = 'fetch.choices';
/** Tools sit on the bench between these x positions. */
const BENCH: Row = { left: 520, right: 1180, y: 468, scaleFew: 1.1, scaleMany: 0.95 };

let praiseTurn = 0;

/** Fetch the Tool: Pops asks for a tool, he finds it on the bench. */
export function fetchScene(): Scene {
  return {
    backdrop: FLOOR,
    mount(ctx) {
      const svg = stageSvg();
      const scene = benchScene();
      const pops = new Pops(80, 118, 1);
      const toolsLayer = s('g');
      svg.append(scene.back, pops.el, scene.bench, toolsLayer);
      ctx.root.append(svg);
      popsLife(ctx, pops);

      void runRound(ctx, svg, pops, toolsLayer).catch((err) => {
        console.error(err);
        ctx.go('hub');
      });
    },
  };
}

async function runRound(ctx: SceneContext, svg: SVGSVGElement, pops: Pops, layer: SVGGElement): Promise<void> {
  ctx.difficulty.startRound(TRACK, 2, 4);
  const asked: ToolId[] = [];
  let newTool: ToolId | null = null;

  // Decode this round's likely lines up front so each starts instantly.
  const pool0 = toolPool(ctx.progress);
  ctx.app.audio.preload([
    'fetch.intro',
    ...pool0.flatMap((t) => ['fetch.ask', 'fetch.found', 'fetch.thatsThe'].map((l) => lineId(l, t))),
    ...PRAISE_LINES,
    'round.great',
    'round.sticker',
    'idle.stillThere',
  ]);

  await ctx.wait(450);
  await ctx.speak('fetch.intro');

  for (let q = 0; q < QUESTIONS; q++) {
    const pool = toolPool(ctx.progress);
    const target = newTool ?? nextTarget(pool, asked);
    asked.push(target);
    const ids = pickChoices(target, pool, ctx.difficulty.choices(TRACK));
    const pieces = makePieces(ids, BENCH);
    await showPieces(ctx, layer, pieces);

    if (newTool) {
      const fresh = pieces.find((p) => p.id === newTool)!;
      bounce(fresh.art, 36);
      ctx.sfx('sparkle');
      await ctx.speak(lineId('fetch.newTool', newTool));
      newTool = null;
    }

    const result = await askQuestion(ctx, {
      promptLine: lineId('fetch.ask', target),
      choices: toolChoices(pieces, target),
      pops,
      svg,
    });

    recordToolAnswer(ctx.progress, target, result.firstTry);
    ctx.difficulty.record(TRACK, 2, 4, result.firstTry);
    newTool = maybeIntroduceTool(ctx.progress);
    ctx.save();

    await deliver(ctx, pops, pieces, target, q);
  }

  recordRound(ctx.progress, 'fetch');
  const sticker = awardSticker(ctx.progress);
  ctx.save();
  await ctx.celebrate({ pops, svg, sticker });
  ctx.go('hub', { params: { newSticker: sticker } });
}

/** The right tool flies to Pops, he uses it, and he thanks the helper. */
async function deliver(ctx: SceneContext, pops: Pops, pieces: ToolPiece[], target: ToolId, q: number): Promise<void> {
  const piece = pieces.find((p) => p.id === target)!;
  const tool = getTool(target);
  for (const p of pieces) if (p !== piece) void finished(fadeTo(p.el, 1, 0, 300)).then(() => p.el.remove());

  ctx.sfx('whoosh');
  const hand = pops.holdPoint();
  const held: Place = { x: hand.x + 8, y: hand.y - 40, rot: 28, scale: 0.8 };
  await ctx.guard(flyArc(piece.el, piece.place, held, TOOL_ORIGIN, 600, 180));
  pops.pose('holding');

  for (let i = 0; i < 3; i++) {
    ctx.sfx(tool.sfx);
    wiggle(piece.art);
    await ctx.wait(330);
  }

  pops.pose('thumbsUp');
  await ctx.speak(lineId('fetch.found', target));
  // Every other answer gets a short extra cheer, rotating through the list.
  if (q % 2 === 1) await ctx.speak(PRAISE_LINES[praiseTurn++ % PRAISE_LINES.length]!);

  await finished(fadeTo(piece.el, 1, 0, 250));
  piece.el.remove();
  pops.pose('idle');
}
