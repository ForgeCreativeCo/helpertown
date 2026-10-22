import type { Character } from '../art/characters';
import { MAMA_PRAISE_LINES, PRAISE_LINES } from '../content/lines';
import { bounce, breathe, finished, wiggle } from '../core/anim';
import { isResting, startRest, timeUp } from '../core/session';
import { localDate } from '../core/storage';
import { s } from '../core/svg';
import type { SceneContext } from '../core/scenes';

let praiseTurn = 0;

/** The next short extra cheer, rotating so it doesn't get repetitive. */
export function nextPraise(): string {
  return PRAISE_LINES[praiseTurn++ % PRAISE_LINES.length]!;
}

/** Mama's version. */
export function nextMamaPraise(): string {
  return MAMA_PRAISE_LINES[praiseTurn++ % MAMA_PRAISE_LINES.length]!;
}

/** The grown-up (Pops or Mama) breathes gently and blinks every few seconds. */
export function characterLife(ctx: SceneContext, pops: Character): void {
  ctx.keep(
    pops.body.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.012, 0.99)' }, { transform: 'scale(1)' }], {
      duration: 3200,
      iterations: Infinity,
      easing: 'ease-in-out',
    }),
  );
  const blink = () => {
    pops.blink();
    ctx.after(2500 + Math.random() * 2500, blink);
  };
  ctx.after(1500, blink);
}

/**
 * Time's up in a place's hub: the lights dim, the grown-up yawns and waves
 * goodbye, and the place closes up (garage door, window shade). Then the
 * game rests until tomorrow.
 */
export async function windDown(
  ctx: SceneContext,
  svg: SVGSVGElement,
  o: { host: Character; goodbyeLine: string; closing: { layers: SVGElement[]; play(): Animation } },
): Promise<void> {
  const { input, audio } = ctx.app;
  input.lock();
  ctx.onCleanup(() => input.unlock());
  audio.clearQueue();
  audio.pauseMusic(true);

  const dim = s('rect', { x: -1280, y: -800, width: 3840, height: 2400, fill: '#0b1630', opacity: 0, class: 'no-hit' });
  svg.append(...o.closing.layers, dim);
  dim.animate([{ opacity: 0 }, { opacity: 0.5 }], { duration: 3500, easing: 'ease-in-out', fill: 'forwards' });

  o.host.pose('yawning');
  await ctx.wait(1500);
  o.host.pose('waving');
  const goodbye = ctx.speak(o.goodbyeLine);
  ctx.keep(
    o.host.body.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(0deg)' }], {
      duration: 1600,
      iterations: Infinity,
    }),
  );
  const close = o.closing.play();
  await goodbye;
  await ctx.guard(finished(close));

  startRest(ctx.progress, localDate());
  ctx.save();
  await ctx.wait(900);
  ctx.go('rest');
}

/**
 * Keeps an eye on the session clock in a hub: rests if today's session is
 * already over, otherwise calls `onTimeUp` once the session length is reached.
 * Returns false if it went straight to the resting screen.
 */
export function watchSession(ctx: SceneContext, firstCheckMs: number, onTimeUp: () => void): boolean {
  if (isResting(ctx.progress, localDate())) {
    ctx.go('rest', { instant: true, queue: true });
    return false;
  }
  const watch = () => {
    if (timeUp(ctx.progress, ctx.app.store.settings.sessionMinutes, localDate())) onTimeUp();
    else ctx.after(5000, watch);
  };
  ctx.after(firstCheckMs, watch);
  return true;
}

/** A big round button (home, town) that says a line and then goes to a scene. */
export function navButton(ctx: SceneContext, svg: SVGSVGElement, art: SVGGElement, cx: number, cy: number, line: string, sceneId: string): void {
  art.setAttribute('class', 'tf');
  const hit = s('g', {}, [s('circle', { cx, cy, r: 86, fill: 'transparent' }), art]);
  svg.append(hit);
  ctx.keep(breathe(art, 0.05, 2000));
  ctx.tap(hit, () => {
    wiggle(art);
    ctx.sfx('tap');
    ctx.app.input.lock();
    ctx.onCleanup(() => ctx.app.input.unlock());
    void ctx.speak(line, { replaceQueued: true }).then(() => ctx.go(sceneId, { from: { x: cx, y: cy } }));
  });
}

/**
 * Invites taps by giving one thing at a time a little hop, taking turns every
 * few seconds. Cheaper on tablets than keeping everything breathing at once.
 */
export function takeTurnsHopping(ctx: SceneContext, els: SVGElement[], everyMs = 2600, startMs = 1500): void {
  let i = 0;
  const hop = () => {
    const el = els[i++ % els.length];
    if (el) bounce(el as SVGGElement, 12);
    ctx.after(everyMs, hop);
  };
  if (els.length) ctx.after(startMs, hop);
}
