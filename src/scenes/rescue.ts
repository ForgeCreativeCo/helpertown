import { Pops, type Character } from '../art/characters';
import { STAMP_SLOTS } from '../art/post';
import { alarmBell, badgeArt, badgeBoard, dispatchDesk, hoseReel, radioSet, RESCUE_BACKDROP, rescueBack } from '../art/rescue';
import { INK } from '../art/palette';
import { townButton } from '../art/town';
import { lineId } from '../content/lines';
import type { StickerId } from '../content/stickers';
import { bounce, placeAt, popIn, wiggle } from '../core/anim';
import { awardBadge, recordRound } from '../core/progress';
import type { Scene, SceneContext } from '../core/scenes';
import type { ActivityId } from '../core/storage';
import { fromMarkup, hitGroup, s, stageSvg } from '../core/svg';
import { characterLife, navButton, takeTurnsHopping, watchSession, windDown } from './common';

/** End of a Rescue Station round: a badge for his board, a celebration, back to the station. */
export async function finishWithBadge(ctx: SceneContext, activity: ActivityId, host: Character, svg: SVGSVGElement): Promise<void> {
  recordRound(ctx.progress, activity);
  const badge = awardBadge(ctx.progress);
  ctx.save();
  await ctx.celebrate({
    pops: host,
    svg,
    reward: { art: badgeArt(badge), lines: ['rescue.badge', lineId('sticker.say', badge)] },
    flyTo: { x: 310, y: 155 },
  });
  ctx.go('rescue', { params: { newBadge: badge } });
}

/**
 * The Rescue Station: the alarm bell opens Who Can Help, the radio opens
 * Siren Sounds, the fire hose opens Fire Hose, and the board shows his badges.
 */
export function rescueScene(): Scene {
  return {
    backdrop: RESCUE_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      svg.append(rescueBack(), badgeBoard());
      ctx.root.append(svg);

      const pops = new Pops(520, 150, 0.8);
      svg.append(pops.el, dispatchDesk());
      characterLife(ctx, pops);

      const spots = [
        { art: alarmBell(), box: { x: 70, y: 300, w: 180, h: 390 }, line: 'rescue.alarm', scene: 'dispatch' },
        { art: radioSet(), box: { x: 410, y: 366, w: 200, h: 176 }, line: 'rescue.radio', scene: 'sirens' },
        { art: hoseReel(), box: { x: 950, y: 370, w: 280, h: 320 }, line: 'rescue.hose', scene: 'flames' },
      ];
      const arts: SVGGElement[] = [];
      for (const spot of spots) {
        const inner = s('g', { class: 'tf-bottom' }, [spot.art]);
        const el = hitGroup(inner, spot.box, 20);
        svg.append(el);
        arts.push(inner);
        ctx.tap(el, () => {
          ctx.sfx(spot.scene === 'dispatch' ? 'ding' : 'tap');
          wiggle(inner);
          ctx.app.input.lock();
          ctx.onCleanup(() => ctx.app.input.unlock());
          const { x, y, w, h } = spot.box;
          void ctx.speak(spot.line, { replaceQueued: true }).then(() => ctx.go(spot.scene, { from: { x: x + w / 2, y: y + h / 2 } }));
        });
      }
      takeTurnsHopping(ctx, arts);

      const badges = s('g');
      svg.append(badges);
      showBadges(ctx, badges, ctx.progress.badges, ctx.params.newBadge as StickerId | undefined);

      let line = 0;
      ctx.tap(pops.el, () => {
        bounce(pops.body, 24);
        ctx.sfx('boing');
        pops.pose(line % 2 === 0 ? 'waving' : 'thumbsUp');
        ctx.after(1400, () => pops.pose('idle'));
        void ctx.speak(line++ % 2 === 0 ? 'pops.hello' : 'pops.giggle', { replaceQueued: true });
      });

      navButton(ctx, svg, townButton(96, 92), 96, 92, 'nav.town', 'town');
      if (ctx.params.greet) ctx.after(250, () => void ctx.speak('rescue.hello'));

      // When the session is over: Pops yawns, waves, and the bay door rolls down.
      watchSession(ctx, ctx.params.greet ? 4000 : 900, () => {
        const door = fromMarkup(`<rect x="460" y="120" width="780" height="420" rx="18" fill="#d9534f" stroke="${INK}" stroke-width="8"/>`);
        door.style.transformOrigin = '850px 120px';
        void windDown(ctx, svg, {
          host: pops,
          goodbyeLine: 'winddown.goodbye',
          closing: {
            layers: [door],
            play: () => door.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 4000, easing: 'ease-in-out', fill: 'forwards' }),
          },
        });
      });
    },
  };
}

/** The newest badges on the board. Tapping one says what's on it. */
function showBadges(ctx: SceneContext, layer: SVGGElement, earned: StickerId[], fresh?: StickerId): void {
  const shown = earned.slice(-STAMP_SLOTS.length);
  shown.forEach((id, i) => {
    const slot = STAMP_SLOTS[i]!;
    const art = badgeArt(id);
    art.setAttribute('class', 'tf');
    const hit = s('rect', { x: -4, y: -4, width: 108, height: 108, fill: 'transparent' });
    const g = s('g', {}, [hit, art]);
    placeAt(g, { x: slot.x, y: slot.y, scale: 0.78, rot: [-6, 5, 4, -5][i] ?? 0 }, { x: 50, y: 50 });
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
