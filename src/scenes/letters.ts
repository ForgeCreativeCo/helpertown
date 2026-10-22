import { Pops } from '../art/characters';
import { bigMailbox, envelopeArt, mailboxSlot, POST_BACKDROP, postBack } from '../art/post';
import { benchScene } from '../art/workshop';
import { letterOrder, nameLetters, type Letter } from '../content/letters';
import { lineId, PRAISE_LINES } from '../content/lines';
import { fadeTo, finished, flyArc } from '../core/anim';
import { letterPool, maybeIntroduceLetter, recordLetterAnswer } from '../core/progress';
import { s } from '../core/svg';
import { nextPraise } from './common';
import { fetchGame } from './fetchGame';
import { finishWithStamp } from './post';
import { TOOL_ORIGIN } from './toolPieces';

const MAILBOX = { x: 1050, floor: 820 };

/** Each letter keeps one color, so L always looks like L to him. */
function letterColor(l: Letter): string {
  const colors = ['#e4473b', '#3d7fe0', '#f07f2a', '#3fae5a', '#8b5cd6', '#e85fa4'];
  return colors[letterOrder('').indexOf(l) % colors.length]!;
}

/**
 * Letter Mail: "Find the letter L!" He finds the envelope with that letter on
 * the sorting table and Pops posts it in the big mailbox. Letters start with
 * the ones in his name and grow toward the whole alphabet.
 */
export const lettersScene = fetchGame<Letter>({
  backdrop: POST_BACKDROP,
  track: 'letters.choices',
  questions: 4,
  scenery: () => ({ back: postBack(), front: s('g', {}, [benchScene().bench, bigMailbox(MAILBOX.x, MAILBOX.floor)]) }),
  host: () => new Pops(80, 118, 1),
  row: { left: 450, right: 1010, y: 468, scaleFew: 1.05, scaleMany: 0.92 },
  art: (l) => envelopeArt(l, letterColor(l)),
  pool: (p, ctx) => letterPool(p, ctx.app.store.settings.childName),
  record: recordLetterAnswer,
  introduce: (p, ctx) => maybeIntroduceLetter(p, ctx.app.store.settings.childName),
  lines: {
    intro: 'letter.intro',
    ask: (l) => lineId('letter.find', l),
    thatsThe: (l) => lineId('letter.thatsThe', l),
    found: () => 'letter.foundIt',
    newItem: () => 'letter.newOne',
    praise: nextPraise,
    preload: [...PRAISE_LINES, 'letter.foundIt', 'name.firstLetter', 'round.great', 'post.stamp'],
  },
  async use(ctx, _pops, piece, held) {
    // Pops posts it: the envelope slides into the mailbox slot, and he says the letter.
    const slot = mailboxSlot(MAILBOX.x, MAILBOX.floor);
    await ctx.wait(200);
    await ctx.guard(flyArc(piece.el, held, { x: slot.x, y: slot.y, scale: 0.5, rot: 0 }, TOOL_ORIGIN, 600, 120));
    ctx.sfx('swish');
    await finished(fadeTo(piece.el, 1, 0, 200));
    piece.el.remove();
    await ctx.speak(lineId('letter.say', piece.id));
    if (piece.id === nameLetters(ctx.app.store.settings.childName)[0]) await ctx.speak('name.firstLetter');
  },
  finish: (ctx, pops, svg) => finishWithStamp(ctx, 'letters', pops, svg),
  home: 'post',
});
