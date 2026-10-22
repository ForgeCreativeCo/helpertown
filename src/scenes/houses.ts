import { Pops } from '../art/characters';
import { INK } from '../art/palette';
import { mailTruck, numberHouse, packageArt, POST_BACKDROP } from '../art/post';
import { lineId, PRAISE_LINES } from '../content/lines';
import { bounce, fadeTo, finished, flyArc, placeAt, popIn, type Place } from '../core/anim';
import { maybeIntroduceNumber, numberPool, recordNumberAnswer } from '../core/progress';
import { askQuestion, type Choice } from '../core/question';
import { nextTarget, pickChoices } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import { fromMarkup, s, stageSvg } from '../core/svg';
import { characterLife, nextPraise } from './common';
import { finishWithStamp } from './post';

const TRACK = 'houses.choices';
const QUESTIONS = 4;
const GROUND = 600;
const STREET = { left: 250, right: 1250 };
const HOUSE_SCALE = 0.85;
const TRUCK = { y: 628, scale: 0.42 };
const WALLS = ['#f7d774', '#f7a8cf', '#bfe7f7', '#c9e7b0', '#f5c99a'];
const ROOFS = ['#d9534f', '#3d7fe0', '#3fae5a', '#8b5cd6', '#f07f2a'];

/**
 * Number Houses: "This package goes to house three!" He taps the house with
 * that number, the mail truck drives over, and the package hops to the door.
 * Houses 1–3 at first, growing to 10 as he learns them.
 */
export function housesScene(): Scene {
  return {
    backdrop: POST_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      svg.append(
        fromMarkup(`
          <rect x="-1280" y="-800" width="3840" height="1400" fill="#a9dcf5"/>
          <circle cx="1140" cy="80" r="44" fill="#ffe27a" stroke="#f2b33d" stroke-width="8"/>
          <rect x="-1280" y="560" width="3840" height="60" fill="#7cc46b"/>
          <rect x="-1280" y="600" width="3840" height="30" fill="#d9d2c4"/>
          <rect x="-1280" y="630" width="3840" height="1000" fill="#6b7480"/>
          <path d="M-1280 720 H2560" stroke="#f4f4f4" stroke-width="10" stroke-dasharray="50 40"/>
        `),
      );
      const pops = new Pops(6, 300, 0.66);
      const bag = fromMarkup(`<path d="M30 640 Q20 560 110 556 Q200 560 190 640 Z" fill="#a0612f" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><path d="M60 566 Q110 520 160 566" fill="none" stroke="${INK}" stroke-width="8"/>`);
      const houses = s('g');
      const truck = s('g', {}, [mailTruck()]);
      svg.append(pops.el, bag, houses, truck);
      ctx.root.append(svg);
      characterLife(ctx, pops);

      void run(ctx, svg, pops, houses, truck).catch((err) => {
        console.error(err);
        ctx.go('post');
      });
    },
  };
}

function placeTruck(truck: SVGGElement, x: number): void {
  truck.setAttribute('transform', `translate(${x - 240 * TRUCK.scale} ${TRUCK.y}) scale(${TRUCK.scale})`);
}

async function run(ctx: SceneContext, svg: SVGSVGElement, pops: Pops, houses: SVGGElement, truck: SVGGElement): Promise<void> {
  ctx.difficulty.startRound(TRACK, 2, 4);
  let truckX = 330;
  placeTruck(truck, truckX);
  const asked: string[] = [];
  let newOne: string | null = null;
  ctx.app.audio.preload(['num.intro', 'num.delivered', 'num.newOne', 'round.great', 'post.stamp', ...PRAISE_LINES]);

  await ctx.wait(400);
  await ctx.speak('num.intro');

  for (let q = 0; q < QUESTIONS; q++) {
    const pool = numberPool(ctx.progress);
    const target = newOne ?? nextTarget(pool, asked);
    asked.push(target);
    // A street of houses in number order, with the right one among them.
    const shown = pickChoices(target, pool, ctx.difficulty.choices(TRACK)).sort((a, b) => Number(a) - Number(b));
    const step = (STREET.right - STREET.left) / shown.length;
    const built = shown.map((n, i) => {
      const art = numberHouse(Number(n), WALLS[Number(n) % WALLS.length]!, ROOFS[Number(n) % ROOFS.length]!);
      art.setAttribute('class', 'tf-bottom');
      const hit = s('rect', { x: -10, y: 10, width: 260, height: 300, rx: 30, fill: 'transparent' });
      const el = s('g', {}, [hit, art]);
      const cx = STREET.left + step * (i + 0.5);
      el.setAttribute('transform', `translate(${cx - 120 * HOUSE_SCALE} ${GROUND - 300 * HOUSE_SCALE}) scale(${HOUSE_SCALE})`);
      houses.append(el);
      ctx.after(i * 120, () => {
        popIn(art);
        ctx.sfx('tap');
      });
      return { n, el, art, cx };
    });
    await ctx.wait(shown.length * 120 + 400);

    // The package waits on the truck.
    const pkg = s('g', {}, [packageArt()]);
    const onTruck: Place = { x: truckX, y: TRUCK.y - 10, scale: 0.8 };
    placeAt(pkg, onTruck, { x: 50, y: 50 });
    svg.append(pkg);
    popIn(pkg.firstElementChild as SVGGElement);

    if (newOne) {
      ctx.sfx('sparkle');
      await ctx.speak('num.newOne');
    }

    const choices: Choice[] = built.map((h) => ({
      el: h.el,
      art: h.art,
      correct: h.n === target,
      nameLine: lineId('num.thatsHouse', h.n),
      glow: { cx: 120, cy: 170, r: 150 },
      center: { x: h.cx, y: GROUND - 140 },
    }));
    const result = await askQuestion(ctx, { promptLine: lineId('num.ask', target), choices, pops, svg });
    recordNumberAnswer(ctx.progress, target, result.firstTry);
    ctx.difficulty.record(TRACK, 2, 4, result.firstTry);
    newOne = maybeIntroduceNumber(ctx.progress);
    ctx.save();

    // Drive over, hop the package to the door, ding-dong.
    const house = built.find((h) => h.n === target)!;
    ctx.sfx('vroom');
    const from = truckX;
    const drive = truck.animate(
      [
        { transform: `translate(${from - 240 * TRUCK.scale}px, ${TRUCK.y}px) scale(${TRUCK.scale})` },
        { transform: `translate(${house.cx - 240 * TRUCK.scale}px, ${TRUCK.y}px) scale(${TRUCK.scale})` },
      ],
      { duration: 900, easing: 'ease-in-out', fill: 'forwards' },
    );
    pkg.animate(
      [{ transform: `translate(${from}px, ${TRUCK.y - 10}px) scale(0.8) translate(-50px, -50px)` }, { transform: `translate(${house.cx}px, ${TRUCK.y - 10}px) scale(0.8) translate(-50px, -50px)` }],
      { duration: 900, easing: 'ease-in-out', fill: 'forwards' },
    );
    await ctx.guard(finished(drive));
    truckX = house.cx;
    placeTruck(truck, truckX);
    drive.cancel();
    await ctx.guard(flyArc(pkg, { ...onTruck, x: truckX }, { x: house.cx, y: GROUND - 20, scale: 0.7 }, { x: 50, y: 50 }, 500, 90));
    ctx.sfx('ding');
    bounce(house.art, 16);
    pops.pose('thumbsUp');
    await ctx.speak('num.delivered');
    if (q % 2 === 1) await ctx.speak(nextPraise());
    pops.pose('idle');

    await Promise.all([finished(fadeTo(pkg, 1, 0, 300)), ...built.map((h) => finished(fadeTo(h.el, 1, 0, 300)))]);
    pkg.remove();
    houses.replaceChildren();
  }

  await finishWithStamp(ctx, 'houses', pops, svg);
}
