import { crackedEggArt, eggArt, fruitPieceArt, muffinArt, muffinTin, oven, spoonArt } from '../art/bakery';
import { Mama, type Character } from '../art/characters';
import { cookBack, ingredientArt, KITCHEN_BACKDROP, kitchenCounter, mixingBowl } from '../art/kitchen';
import type { FlavorId } from '../content/bakery';
import { lineId } from '../content/lines';
import { bounce, fadeTo, finished, flyArc, placeAt, popIn, wiggle, type Place } from '../core/anim';
import { addCount, addToBakery, nextFlavor } from '../core/bakePlan';
import { recordRound } from '../core/progress';
import { askQuestion } from '../core/question';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { characterLife } from './common';

const TAPS = 'bake.taps';
const BOWL = { x: 520, y: 520 };
/** Batter sits on the bowl's rim; its color shows each step. */
const BATTER = { eggs: '#f9d86b', flour: '#efe2c4', milk: '#f6efe2', stirred: '#e9c27a' };
const SMALL = { x: 50, y: 50 };
const BIG = { x: 80, y: 80 };

interface Bake {
  ctx: SceneContext;
  svg: SVGSVGElement;
  mama: Character;
  items: SVGGElement;
  bowl: SVGGElement;
  batter: SVGEllipseElement;
}

/**
 * Bake Together: muffins with Mama. Each step is one big glowing thing to tap
 * (an egg, the flour, the milk, the bowl to stir, fruit to count in, the oven),
 * so there's nothing to get wrong; idle help still repeats and glows.
 */
export function bakeScene(): Scene {
  return {
    backdrop: KITCHEN_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const mama = new Mama(40, 100, 1);
      const bowl = mixingBowl(BOWL.x, BOWL.y);
      bowl.setAttribute('class', 'tf-bottom');
      const batter = s('ellipse', { cx: BOWL.x, cy: BOWL.y - 30, rx: 0, ry: 0, fill: BATTER.eggs, class: 'no-hit' });
      batter.style.transition = 'fill 400ms ease-out';
      const { oven: ovenEl, glow } = oven();
      const items = s('g');
      svg.append(cookBack(), mama.el, kitchenCounter(-1280, 960), ovenEl, bowl, batter, items);
      ctx.root.append(svg);
      characterLife(ctx, mama);

      const b: Bake = { ctx, svg, mama, items, bowl, batter };
      void run(b, ovenEl, glow).catch((err) => {
        console.error(err);
        ctx.go('kitchen');
      });
    },
  };
}

/** One step: a single glowing target; resolves when he taps it. */
function tapIt(b: Bake, el: SVGGElement, art: SVGGElement, glow: { cx: number; cy: number; r: number; ring?: boolean }, prompt: string, silent = false) {
  return askQuestion(b.ctx, {
    promptLine: prompt,
    choices: [{ el, art, correct: true, glow, glowRing: glow.ring, center: { x: glow.cx, y: glow.cy } }],
    pops: b.mama,
    svg: b.svg,
    silentStart: silent,
    glowFromStart: true,
    stillThereLine: 'mama.stillThere',
  });
}

/** An item placed on the counter, with art that can wobble separately from its position. */
function placed(art: SVGGElement, place: Place, origin: { x: number; y: number }, pad = 26): { el: SVGGElement; art: SVGGElement } {
  art.setAttribute('class', 'tf');
  const size = origin.x * 2;
  const hit = s('rect', { x: -pad, y: -pad, width: size + pad * 2, height: size + pad * 2, rx: 30, fill: 'transparent' });
  const el = s('g', {}, [hit, art]);
  placeAt(el, place, origin);
  return { el, art };
}

function showBatter(b: Bake, color: string): void {
  b.batter.setAttribute('rx', '76');
  b.batter.setAttribute('ry', '12');
  b.batter.setAttribute('fill', color);
}

async function run(b: Bake, ovenEl: SVGGElement, glow: SVGRectElement): Promise<void> {
  const { ctx } = b;
  const flavor = nextFlavor(ctx.progress);
  ctx.difficulty.startRound(TAPS, 2, 5);
  const stirs = ctx.difficulty.track(TAPS, 2, 5).value;
  const fruit = addCount(stirs);
  ctx.app.audio.preload([
    'bake.intro', 'bake.eggs', 'bake.otherEgg', 'bake.flour', 'bake.milk', 'bake.stir',
    ...[1, 2, 3, 4, 5].map((n) => lineId('mama.count', String(n))),
    lineId('bake.add', `${flavor}-${fruit}`), 'bake.tin', 'bake.oven', 'bake.wait', 'bake.ding',
    lineId('bake.done', flavor), 'mama.great', 'bake.shelf',
  ]);

  await ctx.wait(400);
  await ctx.speak('bake.intro');

  // 1. Crack two eggs.
  for (let i = 0; i < 2; i++) {
    const egg = placed(eggArt(), { x: 760 + i * 130, y: 452, scale: 1.1 }, SMALL);
    b.items.append(egg.el);
    popIn(egg.art);
  }
  for (let i = 0; i < 2; i++) {
    const egg = b.items.children[i] as SVGGElement;
    const art = egg.lastElementChild as SVGGElement;
    await tapIt(b, egg, art, { cx: 50, cy: 50, r: 70 }, i === 0 ? 'bake.eggs' : 'bake.otherEgg');
    await ctx.guard(flyArc(egg, { x: 760 + i * 130, y: 452, scale: 1.1 }, { x: BOWL.x, y: BOWL.y - 60, scale: 0.8 }, SMALL, 420, 80));
    ctx.sfx('crack');
    egg.replaceChildren(crackedEggArt());
    showBatter(b, BATTER.eggs);
    wiggle(b.bowl);
    void finished(fadeTo(egg, 1, 0, 500)).then(() => (egg.style.visibility = 'hidden'));
    await ctx.wait(500);
  }
  b.items.replaceChildren();

  // 2. Pour the flour, then the milk.
  for (const [id, line, sfx, color] of [
    ['flour', 'bake.flour', 'puff', BATTER.flour],
    ['milk', 'bake.milk', 'pour', BATTER.milk],
  ] as const) {
    const start: Place = { x: 840, y: 436, scale: 1 };
    const item = placed(ingredientArt(id), start, BIG);
    b.items.append(item.el);
    popIn(item.art);
    await ctx.wait(300);
    await tapIt(b, item.el, item.art, { cx: 80, cy: 80, r: 100 }, line);
    const over: Place = { x: BOWL.x + 70, y: BOWL.y - 150, scale: 0.8, rot: -110 };
    await ctx.guard(flyArc(item.el, start, over, BIG, 500, 60));
    ctx.sfx(sfx);
    showBatter(b, color);
    wiggle(b.bowl);
    await ctx.wait(700);
    await finished(fadeTo(item.el, 1, 0, 250));
    item.el.remove();
  }

  // 3. Stir while Mama counts.
  const spoon = spoonArt();
  spoon.setAttribute('class', 'no-hit');
  const spoonHolder = s('g', { transform: `translate(${BOWL.x} ${BOWL.y - 30})` }, [spoon]);
  spoon.style.transformBox = 'view-box';
  spoon.style.transformOrigin = '0px 0px';
  b.svg.append(spoonHolder);
  const bowlHit = s('rect', { x: BOWL.x - 120, y: BOWL.y - 200, width: 240, height: 290, rx: 40, fill: 'transparent' });
  const bowlTarget = s('g', {}, [bowlHit]);
  b.svg.append(bowlTarget);
  for (let i = 1; i <= stirs; i++) {
    await tapIt(b, bowlTarget, b.bowl, { cx: BOWL.x, cy: BOWL.y - 20, r: 110, ring: true }, 'bake.stir', i > 1);
    ctx.sfx('swish');
    spoon.animate([{ transform: 'rotate(-22deg)' }, { transform: 'rotate(22deg)' }, { transform: 'rotate(0deg)' }], { duration: 420, easing: 'ease-in-out' });
    wiggle(b.bowl);
    if (i === stirs) showBatter(b, BATTER.stirred);
    await ctx.speak(lineId('mama.count', String(i)));
  }
  spoonHolder.remove();

  // 4. Count the fruit in.
  await addFruit(b, flavor, fruit);
  bowlTarget.remove();

  // 5. Into the tin, into the oven (Mama handles the hot part), ding!
  void ctx.speak('bake.tin');
  const tinStart = { x: 790, y: 470 };
  const tin = s('g', { transform: `translate(${tinStart.x - 110} ${tinStart.y - 50})` }, [muffinTin(flavor, false)]);
  b.items.append(tin);
  popIn(tin.firstElementChild as SVGGElement);
  b.batter.setAttribute('rx', '0');
  b.items.querySelectorAll('.fruit-in-bowl').forEach((f) => f.remove());
  await ctx.app.audio.idle();

  const ovenHit = s('rect', { x: 960, y: 310, width: 290, height: 420, rx: 30, fill: 'transparent' });
  const ovenTarget = s('g', {}, [ovenHit]);
  b.svg.append(ovenTarget);
  await tapIt(b, ovenTarget, ovenEl, { cx: 1105, cy: 512, r: 150, ring: true }, 'bake.oven');
  ovenTarget.remove();
  ctx.sfx('click');
  b.mama.pose('holding');
  await ctx.guard(
    finished(
      tin.animate([{ transform: `translate(${tinStart.x - 110}px, ${tinStart.y - 50}px) scale(1)` }, { transform: 'translate(1046px, 474px) scale(0.55)' }], {
        duration: 600,
        easing: 'ease-in-out',
        fill: 'forwards',
      }),
    ),
  );
  tin.remove();
  b.mama.pose('idle');
  // A warm, slow glow (well under one pulse per second).
  const warm = ctx.keep(glow.animate([{ opacity: 0.25 }, { opacity: 0.85 }, { opacity: 0.25 }], { duration: 1600, iterations: Infinity }));
  await ctx.speak('bake.wait');
  await ctx.wait(1800);
  warm.cancel();
  ctx.sfx('ding');
  const baked = s('g', { transform: `translate(${tinStart.x - 110} ${tinStart.y - 50})` }, [muffinTin(flavor, true)]);
  b.items.append(baked);
  popIn(baked.firstElementChild as SVGGElement, 500);
  b.mama.pose('cheering');
  await ctx.speak('bake.ding');
  await ctx.speak(lineId('bake.done', flavor));

  ctx.difficulty.record(TAPS, 2, 5, true);
  recordRound(ctx.progress, 'bake');
  addToBakery(ctx.progress, { kind: 'muffin', flavor });
  ctx.save();
  await ctx.celebrate({
    pops: b.mama,
    svg: b.svg,
    greatLine: 'mama.great',
    reward: { art: muffinArt(flavor), lines: ['bake.shelf'] },
    flyTo: { x: 297, y: 150 },
  });
  ctx.go('kitchen', { params: { newBake: true } });
}

/** "Add three blueberries!": each tap hops one piece into the bowl while Mama counts. */
async function addFruit(b: Bake, flavor: FlavorId, count: number): Promise<void> {
  const { ctx } = b;
  const pieces = Array.from({ length: count }, (_, i) => {
    const art = fruitPieceArt(flavor);
    art.setAttribute('class', 'tf');
    const place: Place = { x: 740 + (i % 2) * 110, y: 400 + Math.floor(i / 2) * 90, scale: 0.85 };
    const g = s('g', {}, [art]);
    placeAt(g, place, SMALL);
    return { g, art, place };
  });
  // The whole pile is one big target: any tap on it moves the next piece.
  const hit = s('rect', { x: 650, y: 320, width: 310, height: 210, rx: 40, fill: 'transparent' });
  const pile = s('g', {}, [hit, ...pieces.map((p) => p.g)]);
  b.items.append(pile);
  pieces.forEach((p, i) => ctx.after(i * 100, () => popIn(p.art)));
  await ctx.wait(count * 100 + 300);

  for (let i = 0; i < count; i++) {
    await tapIt(b, pile, pieces[i]!.art, { cx: 805, cy: 440, r: 150 }, lineId('bake.add', `${flavor}-${count}`), i > 0);
    const p = pieces[i]!;
    await ctx.guard(flyArc(p.g, p.place, { x: BOWL.x - 40 + i * 26, y: BOWL.y - 34, scale: 0.32 }, SMALL, 380, 70));
    p.g.classList.add('fruit-in-bowl');
    b.items.append(p.g);
    ctx.sfx('plop');
    bounce(b.bowl, 8);
    await ctx.speak(lineId('mama.count', String(i + 1)));
  }
  pile.remove();
}
