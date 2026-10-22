import { Pops, type Character } from '../art/characters';
import { bigMailbox, glyph, mailTruck, myMailbox, POST_BACKDROP, postBack, postCounter, postWindowFrame, shutter, STAMP_SLOTS, stampArt, stampBoard } from '../art/post';
import { townButton } from '../art/town';
import { nameLetters, tileColor } from '../content/letters';
import { lineId } from '../content/lines';
import type { StickerId } from '../content/stickers';
import { bounce, placeAt, popIn, wiggle } from '../core/anim';
import { awardStamp, recordRound } from '../core/progress';
import type { Scene, SceneContext } from '../core/scenes';
import type { ActivityId } from '../core/storage';
import { hitGroup, s, stageSvg } from '../core/svg';
import { characterLife, navButton, takeTurnsHopping, watchSession, windDown } from './common';

const FLOOR_Y = 690;

/** End of a Post Office round: a stamp for his board, a celebration, back to the post office. */
export async function finishWithStamp(ctx: SceneContext, activity: ActivityId, host: Character, svg: SVGSVGElement): Promise<void> {
  recordRound(ctx.progress, activity);
  const stamp = awardStamp(ctx.progress);
  ctx.save();
  await ctx.celebrate({
    pops: host,
    svg,
    reward: { art: stampArt(stamp), lines: ['post.stamp', lineId('stamp.say', stamp)] },
    flyTo: { x: 310, y: 155 },
  });
  ctx.go('post', { params: { newStamp: stamp } });
}

/**
 * The Post Office: Pops is delivering the mail. The big blue mailbox opens
 * Letter Mail, his own red mailbox opens Name Sign, the mail truck opens
 * Number Houses, and the board shows his stamps.
 */
export function postScene(): Scene {
  return {
    backdrop: POST_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      svg.append(postBack(), stampBoard());
      ctx.root.append(svg);

      const pops = new Pops(480, 170, 0.8);
      svg.append(pops.el, postCounter());
      characterLife(ctx, pops);

      const truck = s('g', { transform: 'translate(890 190) scale(0.62)' }, [mailTruck()]);
      const mine = myMailbox(980, FLOOR_Y);
      const name = nameLetters(ctx.app.store.settings.childName);
      // Once he has built his name, it stays on his mailbox.
      if (name.length && (ctx.progress.rounds.namesign ?? 0) > 0) {
        const size = Math.min(40, 190 / name.length);
        name.forEach((l, i) => mine.append(glyph(l, 1000 + size * 0.55 + i * size * 0.95, 470, size, tileColor(i))));
      }
      const spots: { art: SVGGElement; box: { x: number; y: number; w: number; h: number }; line: string; scene: string }[] = [
        { art: bigMailbox(90, FLOOR_Y), box: { x: 90, y: 290, w: 200, h: 400 }, line: 'post.mailbox', scene: 'letters' },
        { art: truck, box: { x: 880, y: 180, w: 340, h: 190 }, line: 'post.truck', scene: 'houses' },
      ];
      if (name.length) spots.push({ art: mine, box: { x: 980, y: 390, w: 264, h: 300 }, line: 'post.yourMailbox', scene: 'namesign' });

      const arts: SVGGElement[] = [];
      for (const spot of spots) {
        const inner = s('g', { class: 'tf-bottom' }, [spot.art]);
        const el = hitGroup(inner, spot.box, 20);
        svg.append(el);
        if (spot.scene === 'houses') svg.append(postWindowFrame());
        arts.push(inner);
        ctx.tap(el, () => {
          ctx.sfx('tap');
          wiggle(inner);
          ctx.app.input.lock();
          ctx.onCleanup(() => ctx.app.input.unlock());
          const { x, y, w, h } = spot.box;
          void ctx.speak(spot.line, { replaceQueued: true }).then(() => ctx.go(spot.scene, { from: { x: x + w / 2, y: y + h / 2 } }));
        });
      }
      takeTurnsHopping(ctx, arts);

      const stamps = s('g');
      svg.append(stamps);
      showStamps(ctx, stamps, ctx.progress.stamps, ctx.params.newStamp as StickerId | undefined);

      let line = 0;
      ctx.tap(pops.el, () => {
        bounce(pops.body, 24);
        ctx.sfx('boing');
        pops.pose(line % 2 === 0 ? 'waving' : 'thumbsUp');
        ctx.after(1400, () => pops.pose('idle'));
        void ctx.speak(line++ % 2 === 0 ? 'pops.hello' : 'pops.giggle', { replaceQueued: true });
      });

      navButton(ctx, svg, townButton(96, 92), 96, 92, 'nav.town', 'town');
      if (ctx.params.greet) ctx.after(250, () => void ctx.speak('post.hello'));

      // When the session is over: Pops yawns, waves, and the window shutter rolls down.
      watchSession(ctx, ctx.params.greet ? 4000 : 900, () => {
        const shade = shutter(860, 70, 380, 300);
        void windDown(ctx, svg, {
          host: pops,
          goodbyeLine: 'winddown.goodbye',
          closing: {
            layers: [shade],
            play: () => shade.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 4000, easing: 'ease-in-out', fill: 'forwards' }),
          },
        });
      });
    },
  };
}

/** The newest stamps on the board. Tapping one says what's on it. */
function showStamps(ctx: SceneContext, layer: SVGGElement, earned: StickerId[], fresh?: StickerId): void {
  const shown = earned.slice(-STAMP_SLOTS.length);
  shown.forEach((id, i) => {
    const slot = STAMP_SLOTS[i]!;
    const art = stampArt(id);
    art.setAttribute('class', 'tf');
    const hit = s('rect', { x: -4, y: -4, width: 108, height: 108, fill: 'transparent' });
    const g = s('g', {}, [hit, art]);
    placeAt(g, { x: slot.x, y: slot.y, scale: 0.78, rot: [-6, 5, 4, -5][i] ?? 0 }, { x: 50, y: 50 });
    layer.append(g);
    ctx.tap(g, () => {
      wiggle(art);
      ctx.sfx('sparkle');
      void ctx.speak(lineId('stamp.say', id), { replaceQueued: true });
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
