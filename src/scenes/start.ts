import { breathe } from '../core/anim';
import type { Scene } from '../core/scenes';
import { fromMarkup, s, stageSvg } from '../core/svg';

const INK = '#2b1d14';

/** Best-effort fullscreen + landscape lock. Kids mode may ignore both, and that's fine. */
function goFullscreen(): void {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement && el.requestFullscreen) {
      void el
        .requestFullscreen({ navigationUI: 'hide' })
        .then(() => {
          const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
          return o.lock?.('landscape');
        })
        .catch(() => undefined);
    }
  } catch {
    // Not supported.
  }
}

/**
 * One giant play button. The tap unlocks audio (autoplay rules) and asks for
 * fullscreen. Anywhere on the screen counts, so mashing gets him in too.
 */
export function startScene(): Scene {
  return {
    backdrop: '#f2a541',
    mount(ctx) {
      const svg = stageSvg();
      svg.append(
        fromMarkup(`
          <defs>
            <radialGradient id="start-sky" cx="50%" cy="45%" r="75%">
              <stop offset="0" stop-color="#ffd27a"/>
              <stop offset="1" stop-color="#f2a541"/>
            </radialGradient>
          </defs>
          <rect x="-1280" y="-800" width="3840" height="2400" fill="url(#start-sky)"/>
        `),
      );
      const hitAll = s('rect', { x: -1280, y: -800, width: 3840, height: 2400, fill: 'transparent' });
      svg.append(hitAll);

      const ring = s('circle', { cx: 640, cy: 400, r: 205, fill: '#fff3d6', class: 'tf no-hit', opacity: 0.6 });
      const button = fromMarkup(`
        <circle cx="640" cy="400" r="170" fill="#e4473b" stroke="${INK}" stroke-width="12"/>
        <path d="M520 330 a150 150 0 0 1 210 -60" fill="none" stroke="#ff8a7d" stroke-width="18" stroke-linecap="round"/>
        <path d="M600 310 L740 400 L600 490 Z" fill="#fff8e8" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>
      `);
      button.setAttribute('class', 'tf');
      svg.append(ring, button);
      ctx.root.append(svg);

      ctx.keep(breathe(ring, 0.1, 1800));
      ctx.keep(breathe(button, 0.05, 1800));

      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        ctx.app.audio.unlock();
        goFullscreen();
        void navigator.storage?.persist?.().catch(() => undefined);
        ctx.sfx('pop');
        ctx.go('hub', { params: { greet: true }, from: { x: 640, y: 400 } });
      };
      ctx.tap(hitAll, start);
      ctx.tap(button, start);
    },
  };
}
