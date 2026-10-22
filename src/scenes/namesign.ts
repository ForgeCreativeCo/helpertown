import { Pops } from '../art/characters';
import { INK } from '../art/palette';
import { letterTileArt, POST_BACKDROP, postBack } from '../art/post';
import { ALPHABET, nameLetters, tileColor, type Letter } from '../content/letters';
import { lineId, PRAISE_LINES } from '../content/lines';
import { bounce, fadeTo, finished, flyArc, type Place } from '../core/anim';
import { letterPool, recordLetterAnswer } from '../core/progress';
import { gapRange, pickGaps } from '../core/namePlan';
import { askQuestion } from '../core/question';
import { shuffle } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import { fromMarkup, s, stageSvg } from '../core/svg';
import { characterLife } from './common';
import { finishWithStamp } from './post';
import { itemChoices, makePieces, showPieces, TOOL_ORIGIN, type Row } from './toolPieces';

const MISSING = 'name.missing';
const CHOICES = 'name.choices';
const SIGN = { left: 270, right: 1230, y: 220 };
const TRAY: Row = { left: 470, right: 1190, y: 676, scaleFew: 0.95, scaleMany: 0.85 };

/** Slot centers and size on the sign for a name of n letters. */
function slots(n: number): { places: { x: number; y: number }[]; size: number } {
  const step = (SIGN.right - SIGN.left) / n;
  const size = Math.min(130, step - 14);
  return { places: Array.from({ length: n }, (_, i) => ({ x: SIGN.left + step * (i + 0.5), y: SIGN.y })), size };
}

/**
 * Name Sign: building his name for his mailbox. Three letters are missing at
 * first, always including the first one ("Find the letter L!"); after a round
 * with no mistakes there's one more (up to five), and the gaps move around so
 * over time he places every letter. Then Pops reads it back letter by letter:
 * "That spells Lincoln!"
 */
export function namesignScene(): Scene {
  return {
    backdrop: POST_BACKDROP,
    mount(ctx) {
      const name = nameLetters(ctx.app.store.settings.childName);
      if (!name.length) {
        ctx.go('post');
        return;
      }
      const svg = stageSvg();
      const pops = new Pops(10, 300, 0.7);
      const { places, size } = slots(name.length);
      const board = fromMarkup(`
        <rect x="${SIGN.left - 30}" y="${SIGN.y - size / 2 - 30}" width="${SIGN.right - SIGN.left + 60}" height="${size + 60}" rx="22" fill="#e4473b" stroke="${INK}" stroke-width="10"/>
        <rect x="${SIGN.left - 14}" y="${SIGN.y - size / 2 - 14}" width="${SIGN.right - SIGN.left + 28}" height="${size + 28}" rx="14" fill="#f5e6d0"/>
        ${places.map((p) => `<rect x="${p.x - size / 2}" y="${p.y - size / 2}" width="${size}" height="${size}" rx="18" fill="#ffffff" stroke="#c9b79a" stroke-width="5" stroke-dasharray="12 10"/>`).join('')}
        <path d="M${(SIGN.left + SIGN.right) / 2 - 20} ${SIGN.y + size / 2 + 30} V${SIGN.y + size / 2 + 130}" stroke="${INK}" stroke-width="22"/>
        <path d="M${(SIGN.left + SIGN.right) / 2 - 20} ${SIGN.y + size / 2 + 30} V${SIGN.y + size / 2 + 130}" stroke="#a0612f" stroke-width="12"/>`);
      const tray = fromMarkup(`
        <path d="M440 610 H1220 L1250 800 H410 Z" fill="#3d7fe0" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
        <path d="M456 624 H1204 L1222 770 H438 Z" fill="#2f63b3"/>`);
      const bag = fromMarkup(`<path d="M20 700 Q6 600 120 594 Q234 600 220 700 Z" fill="#a0612f" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
        <path d="M60 606 Q120 552 180 606" fill="none" stroke="${INK}" stroke-width="8"/>
        <path d="M84 640 H156 V676 H84 Z M84 640 L120 662 L156 640" fill="#fffaf0" stroke="${INK}" stroke-width="5"/>`);
      const tiles = s('g');
      const layer = s('g');
      svg.append(postBack(), board, tiles, pops.el, bag, tray, layer);
      ctx.root.append(svg);
      characterLife(ctx, pops);

      void run(ctx, svg, pops, name, places, size, tiles, layer).catch((err) => {
        console.error(err);
        ctx.go('post');
      });
    },
  };
}

/** A letter tile sitting in slot i. */
function tileAt(letter: Letter, i: number, place: { x: number; y: number }, size: number): SVGGElement {
  const g = s('g', {}, [letterTileArt(letter, tileColor(i))]);
  g.firstElementChild!.setAttribute('class', 'tf');
  g.setAttribute('transform', `translate(${place.x} ${place.y}) scale(${size / 120}) translate(-80 -80)`);
  return g;
}

async function run(
  ctx: SceneContext,
  svg: SVGSVGElement,
  pops: Pops,
  name: Letter[],
  places: { x: number; y: number }[],
  size: number,
  tiles: SVGGElement,
  layer: SVGGElement,
): Promise<void> {
  const range = gapRange(name.length);
  ctx.difficulty.startRound(MISSING, range.min, range.max);
  ctx.difficulty.startRound(CHOICES, 2, 4);
  const gaps = pickGaps(name.length, ctx.difficulty.track(MISSING, range.min, range.max).value);
  ctx.app.audio.preload([
    'name.intro', 'name.firstLetter', 'name.done', 'round.great', 'post.stamp', ...PRAISE_LINES,
    ...name.flatMap((l) => [lineId('letter.find', l), lineId('letter.say', l)]),
  ]);

  // The letters he doesn't fill in this time are already on the sign.
  const placedTiles: SVGGElement[] = [];
  name.forEach((l, i) => {
    if (gaps.includes(i)) return;
    const t = tileAt(l, i, places[i]!, size);
    tiles.append(t);
    placedTiles[i] = t;
  });

  await ctx.wait(400);
  await ctx.speak('name.intro');

  for (const i of gaps) {
    const target = name[i]!;
    // A soft ring shows which spot is next.
    const ring = s('rect', {
      x: places[i]!.x - size / 2 - 8,
      y: places[i]!.y - size / 2 - 8,
      width: size + 16,
      height: size + 16,
      rx: 24,
      fill: 'none',
      stroke: '#fff3a0',
      'stroke-width': 10,
      class: 'no-hit',
    });
    svg.append(ring);
    const pulse = ctx.keep(ring.animate([{ opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }], { duration: 1400, iterations: Infinity }));

    const others = shuffle([...letterPool(ctx.progress, name.join('')), ...ALPHABET].filter((l) => l !== target));
    const ids = shuffle([target, ...[...new Set(others)].slice(0, ctx.difficulty.choices(CHOICES) - 1)]);
    const pieces = makePieces(ids, TRAY, (l) => letterTileArt(l, tileColor(name.indexOf(l) >= 0 ? name.indexOf(l) : ALPHABET.indexOf(l))));
    await showPieces(ctx, layer, pieces);
    const result = await askQuestion(ctx, {
      promptLine: lineId('letter.find', target),
      choices: itemChoices(pieces, target, (l) => lineId('letter.thatsThe', l)),
      pops,
      svg,
    });
    recordLetterAnswer(ctx.progress, target, result.firstTry);
    ctx.difficulty.record(CHOICES, 2, 4, result.firstTry);
    // Every letter right on the first try counts toward one more gap next time.
    ctx.difficulty.record(MISSING, range.min, range.max, result.firstTry);
    ctx.save();

    // The tile flies up and clicks into its spot on the sign.
    pulse.cancel();
    ring.remove();
    const piece = pieces.find((p) => p.id === target)!;
    for (const p of pieces) if (p !== piece) void finished(fadeTo(p.el, 1, 0, 300)).then(() => p.el.remove());
    const to: Place = { x: places[i]!.x, y: places[i]!.y, scale: size / 120 };
    ctx.sfx('whoosh');
    await ctx.guard(flyArc(piece.el, piece.place, to, TOOL_ORIGIN, 600, 120));
    piece.el.remove();
    const t = tileAt(target, i, places[i]!, size);
    tiles.append(t);
    placedTiles[i] = t;
    ctx.sfx('click');
    await ctx.speak(lineId('letter.say', target));
    if (i === 0) await ctx.speak('name.firstLetter');
  }

  // Pops reads it back, one letter at a time.
  pops.pose('pointing', { x: (SIGN.left + SIGN.right) / 2, y: SIGN.y });
  for (const [i, l] of name.entries()) {
    const art = placedTiles[i]?.firstElementChild as SVGGElement | undefined;
    if (art) bounce(art, 20);
    await ctx.speak(lineId('letter.say', l));
  }
  pops.pose('cheering');
  await ctx.speak('name.done');
  await finishWithStamp(ctx, 'namesign', pops, svg);
}
