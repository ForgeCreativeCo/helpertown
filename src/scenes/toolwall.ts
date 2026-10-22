import { Pops } from '../art/characters';
import { toolArt } from '../art/tools';
import { benchScene, FLOOR, PEGBOARD, pegs, toolWallBack } from '../art/workshop';
import { lineId } from '../content/lines';
import type { ToolId } from '../content/tools';
import { bounce, flyArc, placeAt, popIn, wiggle, type Place } from '../core/anim';
import { atTop } from '../core/difficulty';
import { awardSticker, recordRound, recordToolAnswer, toolPool } from '../core/progress';
import { askQuestion, type Choice } from '../core/question';
import { shuffle } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { planToolWall, visibleOutlines } from '../core/toolWallPlan';
import { nextPraise, characterLife } from './common';
import { TOOL_ORIGIN } from './toolPieces';

const TRACK = 'toolwall.choices';
const SLOT_Y = 290;
const SLOT_SCALE = 1.05;

interface Slot {
  tool: ToolId;
  el: SVGGElement;
  /** The painted outline; it wobbles when tapped by mistake. */
  outline: SVGGElement;
  place: Place;
}

/** Tool Wall: Pops hands him a tool and he taps where it hangs on the pegboard. */
export function toolwallScene(): Scene {
  return {
    backdrop: FLOOR,
    mount(ctx) {
      const svg = stageSvg();
      const pegLayer = s('g');
      const slotLayer = s('g');
      const pops = new Pops(10, 170, 0.9);
      const heldLayer = s('g');
      svg.append(toolWallBack(), pegLayer, slotLayer, pops.el, benchScene().bench, heldLayer);
      ctx.root.append(svg);
      characterLife(ctx, pops);

      void runRound(ctx, svg, pops, { pegLayer, slotLayer, heldLayer }).catch((err) => {
        console.error(err);
        ctx.go('hub');
      });
    },
  };
}

interface Layers {
  pegLayer: SVGGElement;
  slotLayer: SVGGElement;
  heldLayer: SVGGElement;
}

function buildSlots(tools: ToolId[], layers: Layers): Slot[] {
  return tools.map((tool, i) => {
    const place: Place = { x: PEGBOARD.x + (PEGBOARD.w * (i + 0.5)) / tools.length, y: SLOT_Y, scale: SLOT_SCALE };
    layers.pegLayer.append(pegs(place.x, place.y));
    const outline = s('g', { class: 'tf' }, [toolArt(tool)]);
    outline.firstElementChild!.setAttribute('class', 'silhouette');
    outline.style.transition = 'opacity 300ms ease-out';
    outline.style.opacity = '0';
    const hit = s('rect', { x: -14, y: -24, width: 188, height: 208, rx: 30, fill: 'transparent' });
    const el = s('g', {}, [hit, outline]);
    placeAt(el, place, TOOL_ORIGIN);
    layers.slotLayer.append(el);
    return { tool, el, outline, place };
  });
}

async function runRound(ctx: SceneContext, svg: SVGSVGElement, pops: Pops, layers: Layers): Promise<void> {
  ctx.difficulty.startRound(TRACK, 2, 4);
  const top = atTop(ctx.difficulty.track(TRACK, 2, 4));
  const tools = planToolWall(toolPool(ctx.progress), top);
  const slots = buildSlots(tools, layers);

  ctx.app.audio.preload([
    'toolwall.intro',
    ...tools.flatMap((t) => [lineId('toolwall.where', t), lineId('toolwall.thatsFor', t)]),
    'toolwall.allTidy',
    'round.great',
    'round.sticker',
  ]);

  await ctx.wait(400);
  await ctx.speak('toolwall.intro');

  const empty = new Set(tools);
  for (const [q, target] of shuffle(tools).entries()) {
    // Pops holds up the next tool.
    const held = s('g', {}, [toolArt(target)]);
    const hand = pops.holdPoint();
    const inHand: Place = { x: hand.x + 10, y: hand.y - 40, rot: 24, scale: 0.75 };
    placeAt(held, inHand, TOOL_ORIGIN);
    held.firstElementChild!.setAttribute('class', 'tf');
    layers.heldLayer.append(held);
    pops.pose('holding');
    popIn(held.firstElementChild as SVGGElement);
    ctx.sfx('pop');

    // Show the right outline plus a few others still waiting to be filled.
    const shownIds = visibleOutlines(target, [...empty], ctx.difficulty.choices(TRACK));
    const shown = slots.filter((sl) => shownIds.includes(sl.tool));
    for (const sl of slots) if (empty.has(sl.tool)) sl.outline.style.opacity = shownIds.includes(sl.tool) ? '1' : '0';
    await ctx.wait(350);

    const choices: Choice[] = shown.map((sl) => ({
      el: sl.el,
      art: sl.outline,
      correct: sl.tool === target,
      nameLine: lineId('toolwall.thatsFor', sl.tool),
      glow: { cx: TOOL_ORIGIN.x, cy: TOOL_ORIGIN.y, r: 104 },
      center: { x: sl.place.x, y: sl.place.y },
    }));
    const result = await askQuestion(ctx, { promptLine: lineId('toolwall.where', target), choices, pops, svg });
    recordToolAnswer(ctx.progress, target, result.firstTry);
    ctx.difficulty.record(TRACK, 2, 4, result.firstTry);
    ctx.save();

    // The tool arcs over and clicks onto its pegs.
    const slot = slots.find((sl) => sl.tool === target)!;
    ctx.sfx('whoosh');
    await ctx.guard(flyArc(held, inHand, slot.place, TOOL_ORIGIN, 650, 120));
    ctx.sfx('click');
    slot.outline.style.opacity = '0';
    layers.slotLayer.append(held);
    wiggle(held.firstElementChild as SVGGElement);
    empty.delete(target);
    pops.pose('thumbsUp');
    if (q % 2 === 1) await ctx.speak(nextPraise());
    else await ctx.wait(500);
    pops.pose('idle');
  }

  // All tidy: high five!
  pops.pose('highFive');
  bounce(pops.body, 24);
  ctx.sfx('pop');
  ctx.sfx('sparkle');
  await ctx.speak('toolwall.allTidy');

  recordRound(ctx.progress, 'toolwall');
  const sticker = awardSticker(ctx.progress);
  ctx.save();
  await ctx.celebrate({ pops, svg, sticker });
  ctx.go('hub', { params: { newSticker: sticker } });
}
