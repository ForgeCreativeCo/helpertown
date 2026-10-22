import { Pops } from '../art/characters';
import { CONSTRUCTION_BACKDROP, sideBarrier, siteBack, TILE_SIZE, tileArt } from '../art/construction';
import { dinoArt } from '../art/dinos';
import { TILE_COLORS, TILE_SHAPES, type TileShape } from '../content/construction';
import { lineId } from '../content/lines';
import { bounce, fadeTo, finished, flyArc, placeAt, popIn, type Place } from '../core/anim';
import { addGlow } from '../core/glow';
import type { Scene, SceneContext } from '../core/scenes';
import { s, stageSvg } from '../core/svg';
import { characterLife } from './common';
import { finishWithSticker } from './construction';

const GROUND = 706;
const TOWER_X = 640;
const TILE_SCALE = 0.9;
/** Tiles per tower; two towers each visit. */
const TOWERS = [6, 6];
const IDLE_MS = 7000;
/** The tray of tiles to tap, down the right side. */
const TRAY = TILE_SHAPES.map((shape, i) => ({ shape, color: TILE_COLORS[i]!, x: 1110, y: 150 + i * 150 }));

/**
 * Tile Tower: open-ended building like his magnetic tiles. Every tap on a tile
 * in the tray stacks a see-through tile on the tower; nothing is ever wrong.
 * When it's tall, a friendly dinosaur stomps in and knocks it down, and he
 * builds again.
 */
export function buildScene(): Scene {
  return {
    backdrop: CONSTRUCTION_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const pops = new Pops(-10, 300, 0.62);
      const tower = s('g');
      const tray = s('g');
      svg.append(siteBack(), pops.el, sideBarrier(), tower, tray);
      ctx.root.append(svg);
      characterLife(ctx, pops);
      void run(ctx, svg, pops, tower, tray).catch((err) => {
        console.error(err);
        ctx.go('construction');
      });
    },
  };
}

async function run(ctx: SceneContext, svg: SVGSVGElement, pops: Pops, tower: SVGGElement, tray: SVGGElement): Promise<void> {
  ctx.app.audio.preload(['build.tiles', 'build.tall', 'build.dinoComing', 'build.stomp', lineId('sticker.say', 'rex'), 'round.sticker']);

  // The tray: one big tile of each shape. They stay for the whole visit.
  const buttons = TRAY.map((t, i) => {
    const art = tileArt(t.shape, t.color);
    const inner = s('g', { class: 'tf' }, [art]);
    const hit = s('rect', { x: -95, y: -80, width: 190, height: 160, fill: 'transparent' });
    const el = s('g', {}, [hit, inner]);
    placeAt(el, { x: t.x, y: t.y, scale: TILE_SCALE }, { x: 0, y: 0 });
    tray.append(el);
    ctx.after(i * 120, () => popIn(inner));
    return { ...t, el, inner };
  });
  await ctx.wait(700);

  for (let n = 0; n < TOWERS.length; n++) {
    const target = TOWERS[n]!;
    if (n === 0) {
      pops.pose('pointing', { x: TRAY[0]!.x, y: TRAY[0]!.y });
      await ctx.speak('build.tiles');
      pops.pose('idle');
    }

    // Stack tiles until the tower is tall.
    let height = 0;
    let placed = 0;
    const tiles: { el: SVGGElement; at: Place }[] = [];
    await new Promise<void>((resolve) => {
      let idle: (() => void) | null = null;
      let unglow: (() => void) | null = null;
      const armIdle = () => {
        idle?.();
        idle = ctx.after(IDLE_MS, () => {
          const b = buttons[placed % buttons.length]!;
          unglow ??= addGlow(ctx, b.el, 0, 0, 100, 'halo');
          bounce(b.inner, 16);
          void ctx.speak('build.tiles', { replaceQueued: true });
          armIdle();
        });
      };
      armIdle();
      const offs = buttons.map((b) =>
        ctx.tap(b.el, () => {
          if (placed >= target) return;
          unglow?.();
          unglow = null;
          placed++;
          bounce(b.inner, 12);
          const h = TILE_SIZE[b.shape].h * TILE_SCALE;
          const at: Place = { x: TOWER_X + (placed % 2 ? -8 : 8), y: GROUND - height - h / 2, scale: TILE_SCALE };
          height += h;
          const tile = s('g', {}, [tileArt(b.shape as TileShape, b.color)]);
          placeAt(tile, { x: b.x, y: b.y, scale: TILE_SCALE }, { x: 0, y: 0 });
          tower.append(tile);
          tiles.push({ el: tile, at });
          ctx.sfx('whoosh');
          void ctx.guard(flyArc(tile, { x: b.x, y: b.y, scale: TILE_SCALE }, at, { x: 0, y: 0 }, 450, 80)).then(() => ctx.sfx('click'));
          if (placed === target) {
            idle?.();
            for (const off of offs) off();
            ctx.after(600, resolve);
          } else armIdle();
        }),
      );
    });

    pops.pose('cheering');
    ctx.sfx('sparkle');
    for (const t of tiles) bounce(t.el.firstElementChild as SVGGElement, 10);
    await ctx.speak('build.tall');
    pops.pose('idle');

    // Here comes a dinosaur: it stomps in from the right and the tiles tumble.
    await ctx.speak('build.dinoComing');
    await stomp(ctx, svg, tiles);
    if (n < TOWERS.length - 1) await ctx.speak('build.stomp');
    tower.replaceChildren();
  }

  await finishWithSticker(ctx, 'build', pops, svg);
}

async function stomp(ctx: SceneContext, svg: SVGSVGElement, tiles: { el: SVGGElement; at: Place }[]): Promise<void> {
  const rex = dinoArt('rex');
  rex.setAttribute('class', 'tf-bottom');
  const walker = s('g', { class: 'no-hit' }, [rex]);
  const scale = 1.2;
  const y = GROUND - 252 * scale;
  svg.append(walker);
  // Faces left: flip it so it walks toward the tower.
  const at = (x: number) => `translate(${x}px, ${y}px) translate(${300 * scale}px, 0px) scale(${-scale}, ${scale})`;
  const walkIn = walker.animate([{ transform: at(1400) }, { transform: at(TOWER_X + 40) }], { duration: 1600, easing: 'ease-out', fill: 'forwards' });
  for (let i = 0; i < 4; i++) ctx.after(i * 400, () => ctx.sfx('boing'));
  await ctx.guard(finished(walkIn));
  await ctx.speak(lineId('sticker.say', 'rex'));

  // STOMP! The tiles tumble off to both sides and fade.
  bounce(rex, 50);
  ctx.sfx('bang');
  tiles.forEach((t, i) => {
    const side = i % 2 ? 1 : -1;
    const to: Place = { x: t.at.x + side * (160 + i * 40), y: GROUND - 40, scale: TILE_SCALE * 0.8, rot: side * (40 + i * 15) };
    void ctx.guard(flyArc(t.el, t.at, to, { x: 0, y: 0 }, 600, 120 + i * 20)).then(() => fadeTo(t.el, 1, 0, 400));
  });
  await ctx.wait(900);
  const walkOut = walker.animate([{ transform: at(TOWER_X + 40) }, { transform: at(1500) }], { duration: 1400, easing: 'ease-in', fill: 'forwards' });
  await ctx.guard(finished(walkOut));
  walker.remove();
}
