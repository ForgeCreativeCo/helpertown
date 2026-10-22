import type { App } from '../core/scenes';

const RING = 2 * Math.PI * 26;
export const MUTE_HOLD_MS = 1000;

const SPEAKER = `<path fill="#ffffff" d="M14 26h8l10-9v30l-10-9h-8z"/>`;
const WAVES = `<path d="M38 24q5 8 0 16M43 19q9 13 0 26" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`;
const CROSS = `<path d="M38 25l12 14M50 25l-12 14" stroke="#ff8a7d" stroke-width="5" stroke-linecap="round"/>`;

/**
 * A faint speaker next to the parent gear. Holding it for 1 second (one
 * finger) mutes every sound; holding it again brings the sound back. A quick
 * tap does nothing, so he can't silence the game by accident. Muting isn't
 * saved: the game always opens with sound.
 */
export function mountMute(app: App): void {
  const el = document.createElement('div');
  el.id = 'mute';
  el.innerHTML = `
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="rgba(43,29,20,0.45)" stroke="rgba(255,255,255,0.25)" stroke-width="5"/>
      <circle class="ring" cx="32" cy="32" r="26" fill="none" stroke="#fff3a0" stroke-width="5"
        stroke-linecap="round" transform="rotate(-90 32 32)" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>
      ${SPEAKER}
      <g class="icon"></g>
    </svg>`;
  app.stage.viewport.append(el);
  const ring = el.querySelector<SVGCircleElement>('.ring')!;
  const icon = el.querySelector<SVGGElement>('.icon')!;
  const show = () => {
    icon.innerHTML = app.audio.engine.muted ? CROSS : WAVES;
    el.classList.toggle('muted', app.audio.engine.muted);
  };
  show();
  app.input.onHold(
    el,
    MUTE_HOLD_MS,
    (f) => {
      ring.setAttribute('stroke-dashoffset', String(RING * (1 - f)));
      el.classList.toggle('holding', f > 0);
    },
    () => {
      ring.setAttribute('stroke-dashoffset', String(RING));
      el.classList.remove('holding');
      app.audio.engine.setMuted(!app.audio.engine.muted);
      show();
    },
  );
}
