import { Pops } from '../art/pops';
import { stickerArt } from '../art/stickers';
import {
  carLift,
  coffeeMug,
  FLOOR,
  garageCurtain,
  garageDoor,
  pegboard,
  radio,
  sleepingCat,
  toolbox,
  TOOLBOX_STICKER_SLOTS,
  workbench,
  workshopBackground,
} from '../art/workshop';
import { lineId } from '../content/lines';
import type { StickerId } from '../content/stickers';
import { bounce, breathe, finished, placeAt, popIn, wiggle } from '../core/anim';
import { photoUrl } from '../core/photos';
import { isResting, startRest, timeUp } from '../core/session';
import { localDate } from '../core/storage';
import { woodFrame } from '../art/frames';
import type { Scene, SceneContext } from '../core/scenes';
import { hitGroup, s, stageSvg } from '../core/svg';

interface HubSpot {
  lineId: string;
  art: () => SVGGElement;
  box: { x: number; y: number; w: number; h: number };
  /** Scene this spot opens; until it exists, the spot just says its name. */
  sceneId?: string;
  /** Drawn in front of Pops and the workbench. */
  front?: boolean;
}

const SPOTS: HubSpot[] = [
  { lineId: 'hub.pegboard', art: pegboard, box: { x: 70, y: 95, w: 320, h: 235 }, sceneId: 'toolwall' },
  { lineId: 'hub.garage', art: garageDoor, box: { x: 987, y: 160, w: 260, h: 535 }, sceneId: 'garage' },
  { lineId: 'hub.lift', art: carLift, box: { x: 705, y: 410, w: 280, h: 280 }, front: true, sceneId: 'fixit' },
  { lineId: 'hub.toolbox', art: toolbox, box: { x: 100, y: 500, w: 265, h: 190 }, front: true, sceneId: 'fetch' },
];

/** Pops' Workshop: the home screen. */
export function hubScene(): Scene {
  return {
    backdrop: FLOOR,
    mount(ctx) {
      const svg = stageSvg();
      const wall = s('g');
      svg.append(workshopBackground(), wall);
      ctx.root.append(svg);

      // The real Pops, framed on the wall (if a photo was added).
      void ctx.guard(photoUrl('pops')).then((url) => {
        if (url) wall.append(woodFrame(url, 784, 70, 150, 124));
      });

      // Pops stands behind the workbench; the lift and toolbox sit in front of it.
      const back = s('g');
      const front = s('g');
      const groups = new Map<string, SVGGElement>();
      SPOTS.forEach((spot, i) => {
        const art = spot.art();
        art.setAttribute('class', 'tf-bottom');
        const g = hitGroup(art, spot.box, 24);
        (spot.front ? front : back).append(g);
        groups.set(spot.lineId, g);
        ctx.keep(breathe(art, 0.025, 2400, i * 600));
        ctx.tap(g, () => {
          ctx.sfx('tap');
          wiggle(g);
          if (spot.sceneId) {
            // Say its name, then zoom into it.
            const { x, y, w, h } = spot.box;
            void ctx.speak(spot.lineId, { replaceQueued: true }).then(() =>
              ctx.go(spot.sceneId!, { from: { x: x + w / 2, y: y + h / 2 } }),
            );
            ctx.app.input.lock();
            ctx.onCleanup(() => ctx.app.input.unlock());
          } else {
            void ctx.speak(spot.lineId, { replaceQueued: true });
          }
        });
      });

      const pops = new Pops(440, 170, 0.8);
      const mug = coffeeMug();
      const r = radio();
      const cat = sleepingCat();
      const stickers = s('g');
      svg.append(back, r.radio, ...r.notes, cat.cat, pops.el, workbench(), mug.mug, ...mug.steam, front, stickers);

      ambientLife(ctx, pops, mug.steam, r.notes, cat.body);
      showStickers(ctx, stickers, ctx.progress.stickers, ctx.params.newSticker as StickerId | undefined);
      // Just back from Fix It: the garage door honks hello to the vehicles he fixed.
      if (ctx.params.newVehicles) {
        const door = groups.get('hub.garage')!;
        ctx.after(500, () => {
          bounce(door, 20);
          ctx.sfx('honk');
        });
        ctx.after(1100, () => {
          bounce(door, 14);
          ctx.sfx('sparkle');
        });
      }

      let popsLine = 0;
      ctx.tap(pops.el, () => {
        bounce(pops.body, 24);
        ctx.sfx('boing');
        pops.pose(popsLine % 2 === 0 ? 'waving' : 'thumbsUp');
        ctx.after(1400, () => pops.pose('idle'));
        void ctx.speak(popsLine++ % 2 === 0 ? 'pops.hello' : 'pops.giggle', { replaceQueued: true });
      });

      if (ctx.params.greet) ctx.after(250, () => void ctx.speak('start.hello'));

      // Session wind-down: rest if today's session is over; otherwise keep an eye on the clock.
      const progress = ctx.progress;
      if (isResting(progress, localDate())) {
        ctx.go('rest', { instant: true, queue: true });
        return;
      }
      const watch = () => {
        if (timeUp(progress, ctx.app.store.settings.sessionMinutes, localDate())) void windDown(ctx, svg, pops);
        else ctx.after(5000, watch);
      };
      ctx.after(ctx.params.greet ? 4000 : 900, watch);
    },
  };
}

/**
 * Time's up: the lights dim, Pops yawns and waves goodbye, and the garage door
 * slowly rolls down. Then the game rests until tomorrow.
 */
async function windDown(ctx: SceneContext, svg: SVGSVGElement, pops: Pops): Promise<void> {
  const { input, audio } = ctx.app;
  input.lock();
  ctx.onCleanup(() => input.unlock());
  audio.clearQueue();
  audio.pauseMusic(true);

  const { interior, curtain } = garageCurtain();
  interior.style.opacity = '0';
  const dim = s('rect', { x: -1280, y: -800, width: 3840, height: 2400, fill: '#0b1630', opacity: 0, class: 'no-hit' });
  svg.append(interior, curtain, dim);
  dim.animate([{ opacity: 0 }, { opacity: 0.5 }], { duration: 3500, easing: 'ease-in-out', fill: 'forwards' });
  interior.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'forwards' });

  pops.pose('yawning');
  await ctx.wait(1500);
  pops.pose('waving');
  const goodbye = ctx.speak('winddown.goodbye');
  ctx.keep(pops.body.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(0deg)' }], { duration: 1600, iterations: Infinity }));
  const close = curtain.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 4000, easing: 'ease-in-out', fill: 'forwards' });
  await goodbye;
  await ctx.guard(finished(close));

  startRest(ctx.progress, localDate());
  ctx.save();
  await ctx.wait(900);
  ctx.go('rest');
}

/** Small loops that make the workshop feel alive. Slow, gentle, transform/opacity only. */
function ambientLife(ctx: SceneContext, pops: Pops, steam: SVGGElement[], notes: SVGGElement[], catBody: SVGGElement): void {
  ctx.keep(breathe(pops.body, 0.012, 3200));
  ctx.keep(catBody.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(1.08)' }, { transform: 'scaleY(1)' }], { duration: 3000, iterations: Infinity, easing: 'ease-in-out' }));
  steam.forEach((w, i) =>
    ctx.keep(
      w.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 0.8, transform: 'translateY(-4px)', offset: 0.4 },
          { opacity: 0, transform: 'translateY(-22px)' },
        ],
        { duration: 2600, delay: i * 1300, iterations: Infinity, easing: 'ease-out' },
      ),
    ),
  );
  notes.forEach((n, i) =>
    ctx.keep(
      n.animate(
        [
          { opacity: 0, transform: 'translate(0px, 10px)' },
          { opacity: 1, transform: 'translate(6px, -10px)', offset: 0.3 },
          { opacity: 0, transform: 'translate(14px, -46px)' },
        ],
        { duration: 3000, delay: i * 1500, iterations: Infinity, easing: 'ease-out' },
      ),
    ),
  );
  const blink = () => {
    pops.blink();
    ctx.after(2500 + Math.random() * 3000, blink);
  };
  ctx.after(1200, blink);
}

/**
 * The newest stickers on the toolbox front. Tapping one says what it is.
 * A sticker just earned pops in with a sparkle.
 */
function showStickers(ctx: SceneContext, layer: SVGGElement, earned: StickerId[], fresh?: StickerId): void {
  const shown = earned.slice(-TOOLBOX_STICKER_SLOTS.length);
  shown.forEach((id, i) => {
    const slot = TOOLBOX_STICKER_SLOTS[i]!;
    const art = stickerArt(id);
    art.setAttribute('class', 'tf');
    const hit = s('rect', { x: -2, y: -10, width: 104, height: 120, fill: 'transparent' });
    const g = s('g', {}, [hit, art]);
    placeAt(g, { x: slot.x, y: slot.y, scale: 0.52, rot: [-6, 4, -3, 7][i] ?? 0 }, { x: 50, y: 50 });
    layer.append(g);
    ctx.tap(g, () => {
      wiggle(art);
      ctx.sfx('sparkle');
      void ctx.speak(lineId('sticker.say', id), { replaceQueued: true });
    });
    if (fresh && i === shown.length - 1) {
      art.style.opacity = '0';
      ctx.after(450, () => {
        art.style.opacity = '';
        popIn(art, 500);
        ctx.sfx('sparkle');
      });
    }
  });
}
