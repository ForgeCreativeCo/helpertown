import { Mama } from '../art/characters';
import { cookBack, ingredientArt, KITCHEN_BACKDROP, kitchenCounter, magnetArt, mixingBowl } from '../art/kitchen';
import { getIngredient, type IngredientId } from '../content/ingredients';
import { lineId, MAMA_PRAISE_LINES } from '../content/lines';
import { fadeTo, finished, flyArc, wiggle } from '../core/anim';
import { awardMagnet, ingredientPool, maybeIntroduceIngredient, recordIngredientAnswer, recordRound } from '../core/progress';
import { s } from '../core/svg';
import { nextMamaPraise } from './common';
import { fetchGame } from './fetchGame';
import { TOOL_ORIGIN } from './toolPieces';

const BOWL = { x: 440, y: 520 };

/**
 * Fetch the ingredient: Mama asks for something ("Mama needs the eggs!"), he
 * finds it on the counter, and Mama tips it into her mixing bowl.
 */
export const cookScene = fetchGame<IngredientId>({
  backdrop: KITCHEN_BACKDROP,
  track: 'cook.choices',
  questions: 4,
  scenery: () => {
    const bowl = mixingBowl(BOWL.x, BOWL.y);
    bowl.id = 'mixing-bowl';
    bowl.setAttribute('class', 'tf-bottom');
    return { back: cookBack(), front: s('g', {}, [kitchenCounter(-1280, 2560), bowl]) };
  },
  host: () => new Mama(70, 100, 1),
  row: { left: 570, right: 1190, y: 436, scaleFew: 1.05, scaleMany: 0.92 },
  art: ingredientArt,
  pool: ingredientPool,
  record: recordIngredientAnswer,
  introduce: maybeIntroduceIngredient,
  lines: {
    intro: 'cook.intro',
    ask: (id) => lineId('cook.ask', id),
    thatsThe: (id) => lineId('cook.thatsThe', id),
    found: (id) => lineId('cook.found', id),
    newItem: (id) => lineId('cook.newItem', id),
    praise: nextMamaPraise,
    stillThere: 'mama.stillThere',
    preload: [...MAMA_PRAISE_LINES, 'mama.great', 'mama.magnet', 'mama.stillThere'],
  },
  async use(ctx, _mama, piece, held) {
    // Into the bowl it goes, with its own sound, and the bowl gives a happy wobble.
    await ctx.wait(250);
    await ctx.guard(flyArc(piece.el, held, { x: BOWL.x, y: BOWL.y - 46, scale: 0.4, rot: 0 }, TOOL_ORIGIN, 420, 50));
    ctx.sfx(getIngredient(piece.id).sfx);
    const bowl = ctx.root.querySelector<SVGGElement>('#mixing-bowl');
    if (bowl) wiggle(bowl);
    await finished(fadeTo(piece.el, 1, 0, 200));
    piece.el.remove();
  },
  async finish(ctx, mama, svg) {
    recordRound(ctx.progress, 'cook');
    const magnet = awardMagnet(ctx.progress);
    ctx.save();
    await ctx.celebrate({
      pops: mama,
      svg,
      greatLine: 'mama.great',
      reward: { art: magnetArt(magnet), lines: ['mama.magnet', lineId('magnet.say', magnet)] },
      flyTo: { x: 1110, y: 480 },
    });
    ctx.go('kitchen', { params: { newMagnet: magnet } });
  },
  home: 'kitchen',
});
