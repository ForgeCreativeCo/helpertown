import { Pops } from '../art/pops';
import { addProblem, type ProblemView } from '../art/problems';
import { vehicleArt, VEHICLE_H, VEHICLE_W, type VehicleArt } from '../art/vehicles';
import { FLOOR, repairBay } from '../art/workshop';
import { lineId } from '../content/lines';
import { getProblem } from '../content/problems';
import { getTool, type ToolId } from '../content/tools';
import { getVehicle, type VehicleId } from '../content/vehicles';
import type { SfxName } from '../core/audio';
import { bounce, fadeTo, finished, flyArc, popIn, wiggle, type Place } from '../core/anim';
import { atTop } from '../core/difficulty';
import { planFixRound, type FixJob } from '../core/fixPlan';
import { recordFix, recordRound, recordToolAnswer, toolPool } from '../core/progress';
import { askQuestion, type Choice } from '../core/question';
import { pickChoices } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import { fromMarkup, s, stageSvg } from '../core/svg';
import { popsLife } from './common';
import { makePieces, showPieces, TOOL_ORIGIN, toolChoices, type Row, type ToolPiece } from './toolPieces';

const CHOICES = 'fixit.choices';
const TAPS = 'fixit.taps';
/** Where the vehicle sits on the lift (top-left of its 480×300 box). */
const BAY = { x: 520, y: 304 };
const TRAY: Row = { left: 470, right: 1190, y: 702, scaleFew: 0.66, scaleMany: 0.6 };

/** Fix It: a vehicle rolls in broken; he picks the tool and taps to fix it. */
export function fixitScene(): Scene {
  return {
    backdrop: FLOOR,
    mount(ctx) {
      const svg = stageSvg();
      const bay = repairBay();
      const pops = new Pops(30, 190, 0.8);
      const vehicleLayer = s('g');
      const toolLayer = s('g');
      svg.append(bay.back, pops.el, vehicleLayer, bay.front, toolLayer);
      ctx.root.append(svg);
      popsLife(ctx, pops);

      void runRound(ctx, { svg, pops, vehicleLayer, toolLayer }).catch((err) => {
        console.error(err);
        ctx.go('hub');
      });
    },
  };
}

interface Stage {
  svg: SVGSVGElement;
  pops: Pops;
  vehicleLayer: SVGGElement;
  toolLayer: SVGGElement;
}

async function runRound(ctx: SceneContext, st: Stage): Promise<void> {
  ctx.difficulty.startRound(CHOICES, 2, 4);
  ctx.difficulty.startRound(TAPS, 2, 5);
  const pool = toolPool(ctx.progress);
  const jobs = planFixRound(pool, Object.keys(ctx.progress.garage) as VehicleId[]);

  ctx.app.audio.preload([
    'fixit.intro',
    ...jobs.flatMap((j) => [lineId('fixit.problem', j.problem), lineId('fixit.which', j.problem), lineId('fixit.fixed', j.vehicle)]),
    ...pool.flatMap((t) => [lineId('fetch.ask', t), lineId('fetch.thatsThe', t)]),
    'fixit.yourTurn',
    ...[1, 2, 3, 4, 5].map((n) => lineId('fixit.count', String(n))),
    'fixit.toGarage',
    'fixit.star',
    'round.great',
  ]);

  await ctx.wait(400);
  await ctx.speak('fixit.intro');

  const fixed: VehicleId[] = [];
  for (const job of jobs) {
    await fixOne(ctx, st, job, pool);
    fixed.push(job.vehicle);
  }

  recordRound(ctx.progress, 'fixit');
  ctx.save();
  await ctx.celebrate({ pops: st.pops, svg: st.svg });
  ctx.go('hub', { params: { newVehicles: fixed } });
}

/** Moves a positioned group horizontally, spinning the wheels as it goes. */
async function drive(ctx: SceneContext, el: SVGGElement, art: VehicleArt, fromX: number, toX: number, ms: number, easing: string): Promise<void> {
  ctx.sfx('vroom');
  const turns = ((toX - fromX) / (Math.PI * 84)) * 360;
  for (const w of art.spinners) w.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${turns}deg)` }], { duration: ms, easing });
  const a = el.animate([{ transform: `translate(${fromX}px, ${BAY.y}px)` }, { transform: `translate(${toX}px, ${BAY.y}px)` }], {
    duration: ms,
    easing,
    fill: 'forwards',
  });
  await ctx.guard(finished(a));
  el.setAttribute('transform', `translate(${toX} ${BAY.y})`);
  a.cancel();
}

async function fixOne(ctx: SceneContext, st: Stage, job: FixJob, pool: ToolId[]): Promise<void> {
  const { pops } = st;
  const vehicle = getVehicle(job.vehicle);
  const problem = getProblem(job.problem);
  const tool = getTool(problem.tool);
  const taps = ctx.difficulty.track(TAPS, 2, 5).value;
  const problemOnly = atTop(ctx.difficulty.track(CHOICES, 2, 4));

  // 1. The broken vehicle rolls onto the lift.
  const art = vehicleArt(vehicle.id);
  const view = addProblem(art, problem.id);
  const hit = s('rect', { x: -20, y: -20, width: VEHICLE_W + 40, height: VEHICLE_H + 30, rx: 40, fill: 'transparent' });
  const el = s('g', { transform: `translate(-700 ${BAY.y})` }, [hit, art.body]);
  st.vehicleLayer.append(el);
  await drive(ctx, el, art, -700, BAY.x, 1500, 'cubic-bezier(.2,.7,.3,1)');
  bounce(art.body, 10);

  // 2. Pops names the problem (and the tool, below the top level).
  if (!problemOnly) await ctx.speak(lineId('fixit.problem', problem.id));
  const ids = pickChoices(problem.tool, pool, ctx.difficulty.choices(CHOICES));
  const pieces = makePieces(ids, TRAY);
  await showPieces(ctx, st.toolLayer, pieces);
  const result = await askQuestion(ctx, {
    promptLine: problemOnly ? lineId('fixit.which', problem.id) : lineId('fetch.ask', problem.tool),
    choices: toolChoices(pieces, problem.tool),
    pops,
    svg: st.svg,
  });
  recordToolAnswer(ctx.progress, problem.tool, result.firstTry);
  ctx.difficulty.record(CHOICES, 2, 4, result.firstTry);
  ctx.difficulty.record(TAPS, 2, 5, result.firstTry);
  ctx.save();
  pops.pose('idle');

  // 3. The tool flies over to the problem; then he taps to fix, and Pops counts.
  const piece = pieces.find((p) => p.id === problem.tool)!;
  for (const p of pieces) if (p !== piece) void finished(fadeTo(p.el, 1, 0, 300)).then(() => p.el.remove());
  const spot = { x: BAY.x + view.spot.x, y: BAY.y + view.spot.y };
  const hover: Place = { x: spot.x - 60, y: spot.y - 70, rot: -25, scale: 0.55 };
  ctx.sfx('whoosh');
  await ctx.guard(flyArc(piece.el, piece.place, hover, TOOL_ORIGIN, 600, 140));

  const spotChoice: Choice = {
    el,
    art: art.body,
    correct: true,
    glow: { cx: view.spot.x, cy: view.spot.y, r: view.spot.r },
    glowRing: true,
    center: spot,
  };
  for (let i = 1; i <= taps; i++) {
    await askQuestion(ctx, {
      promptLine: i === 1 ? 'fixit.yourTurn' : 'fixit.keepGoing',
      choices: [spotChoice],
      pops,
      svg: st.svg,
      silentStart: i > 1,
      glowFromStart: i === 1,
    });
    useTool(ctx, piece, hover, spot, tool.sfx);
    view.set(i / taps);
    await ctx.speak(lineId('fixit.count', String(i)));
  }

  // 4. Fixed! It tests itself, then heads off to his garage.
  await finishFix(ctx, piece, view, art);
  pops.pose('thumbsUp');
  ctx.sfx(vehicle.test);
  art.testPart();
  await ctx.wait(400);
  await ctx.speak(lineId('fixit.fixed', vehicle.id));
  const outcome = recordFix(ctx.progress, vehicle.id);
  ctx.save();
  if (outcome === 'star') showStar(ctx, el);
  await ctx.speak(outcome === 'new' ? 'fixit.toGarage' : 'fixit.star');
  pops.pose('waving');
  await drive(ctx, el, art, BAY.x, 1500, 1300, 'cubic-bezier(.5,0,.8,.6)');
  el.remove();
  pops.pose('idle');
}

/** The tool jabs at the problem spot and makes its sound. */
function useTool(ctx: SceneContext, piece: ToolPiece, hover: Place, spot: { x: number; y: number }, sfx: SfxName): void {
  ctx.sfx(sfx);
  const nudge = { ...hover, x: hover.x + (spot.x - hover.x) * 0.35, y: hover.y + (spot.y - hover.y) * 0.35 };
  void flyArc(piece.el, hover, nudge, TOOL_ORIGIN, 110, 0).then(() => flyArc(piece.el, nudge, hover, TOOL_ORIGIN, 160, 0));
  wiggle(piece.art);
}

async function finishFix(ctx: SceneContext, piece: ToolPiece, view: ProblemView, art: VehicleArt): Promise<void> {
  ctx.sfx('sparkle');
  void finished(fadeTo(piece.el, 1, 0, 300)).then(() => piece.el.remove());
  await ctx.guard(view.done());
  bounce(art.body, 18);
}

/** A gold star pops up over a vehicle he already had. */
function showStar(ctx: SceneContext, el: SVGGElement): void {
  const star = fromMarkup(
    `<path d="M240 -70 L254 -40 L286 -36 L262 -14 L268 18 L240 2 L212 18 L218 -14 L194 -36 L226 -40 Z" fill="#ffd34d" stroke="#2b1d14" stroke-width="6" stroke-linejoin="round"/>`,
  );
  star.setAttribute('class', 'tf no-hit');
  el.append(star);
  popIn(star, 500);
  ctx.sfx('sparkle');
}
