import { Pops } from '../art/pops';
import { toolArt, TOOL_SIZE } from '../art/tools';
import { benchScene, FLOOR } from '../art/workshop';
import { lineId, PRAISE_LINES } from '../content/lines';
import { getTool, type ToolId } from '../content/tools';
import { fadeTo, finished, flyArc, placeAt, popIn, wiggle, bounce, type Place } from '../core/anim';
import { awardSticker, maybeIntroduceTool, recordRound, recordToolAnswer, toolPool } from '../core/progress';
import { askQuestion, type Choice } from '../core/question';
import { nextTarget, pickChoices } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';

const QUESTIONS = 4;
const TRACK = 'fetch.choices';
const ORIGIN = { x: TOOL_SIZE / 2, y: TOOL_SIZE / 2 };
/** Tools sit on the bench between these x positions, centered at this height. */
const BENCH_LEFT = 520;
const BENCH_RIGHT = 1180;
const TOOL_Y = 468;

let praiseTurn = 0;

interface ToolPiece {
  id: ToolId;
  el: SVGGElement;
  art: SVGGElement;
  place: Place;
}

function slotPlaces(n: number): Place[] {
  const scale = n <= 3 ? 1.1 : 0.95;
  const span = BENCH_RIGHT - BENCH_LEFT;
  return Array.from({ length: n }, (_, i) => ({
    x: BENCH_LEFT + (span * (i + 0.5)) / n,
    y: TOOL_Y,
    scale,
    rot: [-8, 6, -4, 8][i] ?? 0,
  }));
}

function makePiece(id: ToolId, place: Place, spacing: number): ToolPiece {
  const art = toolArt(id);
  art.setAttribute('class', 'tf');
  // Pad the hit area as far as the gap to the next tool allows (always 140+ px).
  const pad = Math.max(8, Math.min(30, (spacing / (place.scale ?? 1) - TOOL_SIZE) / 2));
  const hit = s('rect', {
    x: -pad,
    y: -pad,
    width: TOOL_SIZE + pad * 2,
    height: TOOL_SIZE + pad * 2,
    rx: 30,
    fill: 'transparent',
  });
  const el = s('g', {}, [hit, art]);
  placeAt(el, place, ORIGIN);
  return { id, el, art, place };
}

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
      ctx.keep(
        pops.body.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.012, 0.99)' }, { transform: 'scale(1)' }], {
          duration: 3200,
          iterations: Infinity,
          easing: 'ease-in-out',
        }),
      );
      const blink = () => {
        pops.blink();
        ctx.after(2500 + Math.random() * 2500, blink);
      };
      ctx.after(1500, blink);

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
    const places = slotPlaces(ids.length);
    const spacing = (BENCH_RIGHT - BENCH_LEFT) / ids.length;
    const pieces = ids.map((id, i) => makePiece(id, places[i]!, spacing));

    for (const [i, p] of pieces.entries()) {
      ctx.after(i * 110, () => {
        layer.append(p.el);
        popIn(p.art);
        ctx.sfx('tap');
      });
    }
    await ctx.wait(pieces.length * 110 + 350);

    if (newTool) {
      const fresh = pieces.find((p) => p.id === newTool)!;
      bounce(fresh.art, 36);
      ctx.sfx('sparkle');
      await ctx.speak(lineId('fetch.newTool', newTool));
      newTool = null;
    }

    const choices: Choice[] = pieces.map((p) => ({
      el: p.el,
      art: p.art,
      correct: p.id === target,
      nameLine: lineId('fetch.thatsThe', p.id),
      glow: { cx: ORIGIN.x, cy: ORIGIN.y, r: 100 },
      center: { x: p.place.x, y: p.place.y },
    }));
    const result = await askQuestion(ctx, {
      promptLine: lineId('fetch.ask', target),
      choices,
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
  await ctx.guard(flyArc(piece.el, piece.place, held, ORIGIN, 600, 180));
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
