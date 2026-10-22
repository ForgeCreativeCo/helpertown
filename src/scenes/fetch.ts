import { Pops } from '../art/characters';
import { toolArt } from '../art/tools';
import { benchScene, FLOOR } from '../art/workshop';
import { lineId, PRAISE_LINES } from '../content/lines';
import { getTool, type ToolId } from '../content/tools';
import { wiggle } from '../core/anim';
import { awardSticker, maybeIntroduceTool, recordRound, recordToolAnswer, toolPool } from '../core/progress';
import { nextPraise } from './common';
import { fetchGame } from './fetchGame';

/** Fetch the Tool: Pops asks for a tool, he finds it on the bench, Pops uses it. */
export const fetchScene = fetchGame<ToolId>({
  backdrop: FLOOR,
  track: 'fetch.choices',
  questions: 4,
  scenery: () => {
    const { back, bench } = benchScene();
    return { back, front: bench };
  },
  host: () => new Pops(80, 118, 1),
  row: { left: 520, right: 1180, y: 468, scaleFew: 1.1, scaleMany: 0.95 },
  art: toolArt,
  pool: toolPool,
  record: recordToolAnswer,
  introduce: maybeIntroduceTool,
  lines: {
    intro: 'fetch.intro',
    ask: (id) => lineId('fetch.ask', id),
    thatsThe: (id) => lineId('fetch.thatsThe', id),
    found: (id) => lineId('fetch.found', id),
    newItem: (id) => lineId('fetch.newTool', id),
    praise: nextPraise,
    preload: [...PRAISE_LINES, 'round.great', 'round.sticker', 'idle.stillThere'],
  },
  async use(ctx, _pops, piece) {
    // Pops uses it three times with its own sound.
    for (let i = 0; i < 3; i++) {
      ctx.sfx(getTool(piece.id).sfx);
      wiggle(piece.art);
      await ctx.wait(330);
    }
  },
  async finish(ctx, pops, svg) {
    recordRound(ctx.progress, 'fetch');
    const sticker = awardSticker(ctx.progress);
    ctx.save();
    await ctx.celebrate({ pops, svg, sticker });
    ctx.go('hub', { params: { newSticker: sticker } });
  },
  home: 'hub',
});
