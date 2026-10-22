import type { Character } from '../art/characters';
import { bounce, fadeTo, finished, flyArc, type Place } from '../core/anim';
import { askQuestion } from '../core/question';
import { nextTarget, pickChoices } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import type { Progress } from '../core/storage';
import { s, stageSvg } from '../core/svg';
import { characterLife } from './common';
import { itemChoices, makePieces, showPieces, TOOL_ORIGIN, type Row, type ToolPiece } from './toolPieces';

/**
 * The "fetch" game shared by places: a grown-up asks for something by name and
 * he finds it among 2–4 choices (errorless, adaptive, new items introduced one
 * at a time). Fetch the Tool and Mama's ingredient game are configurations.
 */
export interface FetchConfig<T extends string> {
  backdrop: string;
  /** Difficulty track key, e.g. 'fetch.choices'. */
  track: string;
  questions: number;
  /** Scenery behind and in front of the grown-up. */
  scenery(): { back: SVGGElement; front: SVGGElement };
  host(): Character;
  row: Row;
  art(id: T): SVGGElement;
  pool(p: Progress): T[];
  record(p: Progress, id: T, firstTry: boolean): void;
  introduce(p: Progress): T | null;
  lines: {
    intro: string;
    ask(id: T): string;
    thatsThe(id: T): string;
    found(id: T): string;
    newItem(id: T): string;
    praise(): string;
    stillThere?: string;
    preload: string[];
  };
  /** What happens to the found item (Pops uses the tool; Mama tips it in the bowl). */
  use(ctx: SceneContext, host: Character, piece: ToolPiece<T>, held: Place): Promise<void>;
  /** Round over: reward, celebration and where to go next. */
  finish(ctx: SceneContext, host: Character, svg: SVGSVGElement): Promise<void>;
  /** Scene to fall back to if something goes wrong. */
  home: string;
}

export function fetchGame<T extends string>(cfg: FetchConfig<T>): () => Scene {
  return () => ({
    backdrop: cfg.backdrop,
    mount(ctx) {
      const svg = stageSvg();
      const scene = cfg.scenery();
      const host = cfg.host();
      const layer = s('g');
      svg.append(scene.back, host.el, scene.front, layer);
      ctx.root.append(svg);
      characterLife(ctx, host);

      void runRound(ctx, cfg, svg, host, layer).catch((err) => {
        console.error(err);
        ctx.go(cfg.home);
      });
    },
  });
}

async function runRound<T extends string>(ctx: SceneContext, cfg: FetchConfig<T>, svg: SVGSVGElement, host: Character, layer: SVGGElement): Promise<void> {
  ctx.difficulty.startRound(cfg.track, 2, 4);
  const asked: T[] = [];
  let newItem: T | null = null;

  // Decode this round's likely lines up front so each starts instantly.
  ctx.app.audio.preload([
    cfg.lines.intro,
    ...cfg.pool(ctx.progress).flatMap((id) => [cfg.lines.ask(id), cfg.lines.found(id), cfg.lines.thatsThe(id)]),
    ...cfg.lines.preload,
  ]);

  await ctx.wait(450);
  await ctx.speak(cfg.lines.intro);

  for (let q = 0; q < cfg.questions; q++) {
    const pool = cfg.pool(ctx.progress);
    const target = newItem ?? nextTarget(pool, asked);
    asked.push(target);
    const ids = pickChoices(target, pool, ctx.difficulty.choices(cfg.track));
    const pieces = makePieces(ids, cfg.row, cfg.art);
    await showPieces(ctx, layer, pieces);

    if (newItem) {
      const fresh = pieces.find((p) => p.id === newItem)!;
      bounce(fresh.art, 36);
      ctx.sfx('sparkle');
      await ctx.speak(cfg.lines.newItem(newItem));
      newItem = null;
    }

    const result = await askQuestion(ctx, {
      promptLine: cfg.lines.ask(target),
      choices: itemChoices(pieces, target, cfg.lines.thatsThe),
      pops: host,
      svg,
      stillThereLine: cfg.lines.stillThere,
    });

    cfg.record(ctx.progress, target, result.firstTry);
    ctx.difficulty.record(cfg.track, 2, 4, result.firstTry);
    newItem = cfg.introduce(ctx.progress);
    ctx.save();

    // The right one flies to the grown-up's hand, gets used, and he's thanked.
    const piece = pieces.find((p) => p.id === target)!;
    for (const p of pieces) if (p !== piece) void finished(fadeTo(p.el, 1, 0, 300)).then(() => p.el.remove());
    ctx.sfx('whoosh');
    const hand = host.holdPoint();
    const held: Place = { x: hand.x + 8, y: hand.y - 40, rot: 28, scale: 0.8 };
    await ctx.guard(flyArc(piece.el, piece.place, held, TOOL_ORIGIN, 600, 180));
    host.pose('holding');
    await cfg.use(ctx, host, piece, held);

    host.pose('thumbsUp');
    await ctx.speak(cfg.lines.found(target));
    // Every other answer gets a short extra cheer, rotating through the list.
    if (q % 2 === 1) await ctx.speak(cfg.lines.praise());
    if (piece.el.isConnected) {
      await finished(fadeTo(piece.el, 1, 0, 250));
      piece.el.remove();
    }
    host.pose('idle');
  }

  await cfg.finish(ctx, host, svg);
}
