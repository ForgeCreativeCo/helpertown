import { bigCookie, COOKIE_SPOTS, cookieArt, decoArt } from '../art/bakery';
import { Mama } from '../art/characters';
import { cookBack, KITCHEN_BACKDROP, kitchenCounter } from '../art/kitchen';
import { INK } from '../art/palette';
import type { DecoId } from '../content/bakery';
import { lineId, MAMA_PRAISE_LINES } from '../content/lines';
import { fadeTo, finished, flyArc, type Place } from '../core/anim';
import { addToBakery, decoChoices, planCookie } from '../core/bakePlan';
import { recordRound } from '../core/progress';
import { askQuestion } from '../core/question';
import type { Scene, SceneContext } from '../core/scenes';
import { fromMarkup, s, stageSvg } from '../core/svg';
import { characterLife, nextMamaPraise } from './common';
import { itemChoices, makePieces, showPieces, TOOL_ORIGIN, type Row } from './toolPieces';

const TRACK = 'deco.choices';
const COOKIE = { x: 760, y: 330, r: 140 };
const TRAY: Row = { left: 470, right: 1190, y: 680, scaleFew: 0.95, scaleMany: 0.85 };

/** Icing filling the 160-unit box the choice rows use (the art is drawn in 100). */
function decoPiece(id: DecoId): SVGGElement {
  const inner = decoArt(id);
  inner.setAttribute('transform', 'translate(5 5) scale(1.5)');
  return s('g', {}, [inner]);
}

/** Decorate Cookies: "Put a red heart on the cookie!" Three decorations make a cookie. */
export function decorateScene(): Scene {
  return {
    backdrop: KITCHEN_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const mama = new Mama(40, 110, 1);
      const cookie = bigCookie();
      cookie.setAttribute('transform', `translate(${COOKIE.x} ${COOKIE.y})`);
      const tray = fromMarkup(`
        <path d="M440 610 H1220 L1250 800 H410 Z" fill="#f7a8cf" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
        <path d="M456 624 H1204 L1222 770 H438 Z" fill="#f4c0dc"/>`);
      const onCookie = s('g');
      const layer = s('g');
      svg.append(cookBack(), mama.el, kitchenCounter(-1280, 2560), cookie, onCookie, tray, layer);
      ctx.root.append(svg);
      characterLife(ctx, mama);

      void run(ctx, svg, mama, onCookie, layer).catch((err) => {
        console.error(err);
        ctx.go('kitchen');
      });
    },
  };
}

async function run(ctx: SceneContext, svg: SVGSVGElement, mama: Mama, onCookie: SVGGElement, layer: SVGGElement): Promise<void> {
  ctx.difficulty.startRound(TRACK, 2, 4);
  const plan = planCookie();
  ctx.app.audio.preload(['deco.intro', ...plan.map((d) => lineId('deco.ask', d)), 'deco.done', 'deco.shelf', 'mama.great', ...MAMA_PRAISE_LINES]);

  await ctx.wait(400);
  await ctx.speak('deco.intro');

  for (const [i, target] of plan.entries()) {
    const pieces = makePieces(decoChoices(target, ctx.difficulty.choices(TRACK)), TRAY, decoPiece);
    await showPieces(ctx, layer, pieces);
    const result = await askQuestion(ctx, {
      promptLine: lineId('deco.ask', target),
      choices: itemChoices(pieces, target, (id) => lineId('deco.thatsA', id)),
      pops: mama,
      svg,
      stillThereLine: 'mama.stillThere',
    });
    ctx.difficulty.record(TRACK, 2, 4, result.firstTry);
    ctx.save();

    // The icing flies onto the cookie and stays there.
    const piece = pieces.find((p) => p.id === target)!;
    for (const p of pieces) if (p !== piece) void finished(fadeTo(p.el, 1, 0, 300)).then(() => p.el.remove());
    const spot = COOKIE_SPOTS[i]!;
    const to: Place = { x: COOKIE.x + spot.x * COOKIE.r, y: COOKIE.y + spot.y * COOKIE.r, scale: 0.36 };
    ctx.sfx('whoosh');
    await ctx.guard(flyArc(piece.el, piece.place, to, TOOL_ORIGIN, 600, 140));
    onCookie.append(piece.el);
    ctx.sfx('plop');
    ctx.sfx('sparkle');
    mama.pose('thumbsUp');
    if (i % 2 === 1) await ctx.speak(nextMamaPraise());
    else await ctx.wait(500);
    mama.pose('idle');
  }

  mama.pose('cheering');
  await ctx.speak('deco.done');
  recordRound(ctx.progress, 'decorate');
  addToBakery(ctx.progress, { kind: 'cookie', decos: plan });
  ctx.save();
  await ctx.celebrate({
    pops: mama,
    svg,
    greatLine: 'mama.great',
    reward: { art: cookieArt(plan), lines: ['deco.shelf'] },
    flyTo: { x: 297, y: 150 },
  });
  ctx.go('kitchen', { params: { newBake: true } });
}
