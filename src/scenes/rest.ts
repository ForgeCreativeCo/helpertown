import { INK } from '../art/palette';
import { garageDoor, sleepingCat } from '../art/workshop';
import { isResting } from '../core/session';
import { localDate } from '../core/storage';
import type { Scene } from '../core/scenes';
import { fromMarkup, s, stageSvg } from '../core/svg';

/**
 * The calm resting screen after the wind-down: the workshop at night, garage
 * door shut, the cat asleep. Nothing here needs a tap. It goes back to the
 * workshop on its own the next day (or when a grown-up opens the menu).
 */
export function restScene(): Scene {
  return {
    backdrop: '#1c2540',
    mount(ctx) {
      const svg = stageSvg();
      const stars = [
        [480, 90],
        [560, 140],
        [640, 80],
        [700, 160],
        [530, 200],
      ].map(([x, y]) => s('circle', { cx: x!, cy: y!, r: 4, fill: '#fff6c8', class: 'tf' }));
      svg.append(
        fromMarkup(`
          <rect x="-1280" y="-800" width="3840" height="1400" fill="#5b4a5e"/>
          <rect x="-1280" y="600" width="3840" height="1000" fill="#3d2e36"/>
          <rect x="440" y="60" width="300" height="190" rx="14" fill="#1c2540" stroke="${INK}" stroke-width="10"/>
          <path d="M688 92 a30 30 0 1 0 22 44 a24 24 0 1 1 -22 -44 z" fill="#fff3c4"/>
          <line x1="590" y1="60" x2="590" y2="250" stroke="${INK}" stroke-width="8"/>
          <line x1="440" y1="155" x2="740" y2="155" stroke="${INK}" stroke-width="8"/>
          <rect x="428" y="246" width="324" height="20" rx="8" fill="#6e4b33" stroke="${INK}" stroke-width="8"/>
          <rect x="770" y="330" width="190" height="18" rx="6" fill="#6e4b33" stroke="${INK}" stroke-width="8"/>
        `),
        ...stars,
      );
      const door = garageDoor();
      door.setAttribute('opacity', '0.7');
      const cat = sleepingCat();
      // A drawn "z" (no letters on child screens).
      const zzz = fromMarkup(
        `<path d="M0 -22 H20 L0 0 H20" fill="none" stroke="#fff3c4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
      zzz.setAttribute('transform', 'translate(900 270)');
      const dim = s('rect', { x: -1280, y: -800, width: 3840, height: 2400, fill: '#0b1630', opacity: 0.35, class: 'no-hit' });
      svg.append(door, cat.cat, zzz, dim);
      ctx.root.append(svg);

      // Slow, soft motion only: breathing cat, drifting z, twinkling stars (well under 1 per second).
      ctx.keep(cat.body.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(1.08)' }, { transform: 'scaleY(1)' }], { duration: 4000, iterations: Infinity }));
      const z = zzz.firstElementChild as SVGElement;
      ctx.keep(
        z.animate(
          [
            { transform: 'translate(0px, 0px)', opacity: 0 },
            { transform: 'translate(10px, -30px)', opacity: 1, offset: 0.4 },
            { transform: 'translate(24px, -80px)', opacity: 0 },
          ],
          { duration: 4000, iterations: Infinity, easing: 'ease-out' },
        ),
      );
      stars.forEach((st, i) =>
        ctx.keep(st.animate([{ opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }], { duration: 3500, delay: i * 700, iterations: Infinity })),
      );
      ctx.app.audio.pauseMusic(true);
      ctx.onCleanup(() => ctx.app.audio.pauseMusic(false));

      // A new day starts the game fresh.
      const check = () => {
        if (!isResting(ctx.app.store.progress, localDate())) ctx.go('town', { params: { greet: true } });
        else ctx.after(60_000, check);
      };
      ctx.after(60_000, check);
    },
  };
}

/** A plain dark screen behind the parent menu. */
export function pausedScene(): Scene {
  return { backdrop: '#1c120b', mount: () => undefined };
}
