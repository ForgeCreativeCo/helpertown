import type { App } from '../core/scenes';

const RING = 2 * Math.PI * 26;
export const HOLD_MS = 3000;

/**
 * The small, faint gear in the top-right corner. Holding it for 3 seconds
 * (one finger, without sliding off) fills its ring and calls `onUnlock`.
 * Taps, brief holds and palms never get there.
 */
export function mountGear(app: App, onUnlock: () => void): void {
  const el = document.createElement('div');
  el.id = 'gear';
  el.innerHTML = `
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="5"/>
      <circle class="ring" cx="32" cy="32" r="26" fill="none" stroke="#fff3a0" stroke-width="5"
        stroke-linecap="round" transform="rotate(-90 32 32)" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>
      <path fill="#ffffff" d="M29 14h6l1 5 4 2 4-3 4 4-3 4 2 4 5 1v6l-5 1-2 4 3 4-4 4-4-3-4 2-1 5h-6l-1-5-4-2-4 3-4-4 3-4-2-4-5-1v-6l5-1 2-4-3-4 4-4 4 3 4-2z"/>
      <circle cx="32" cy="32" r="6" fill="#5b3a24"/>
    </svg>`;
  app.stage.viewport.append(el);
  const ring = el.querySelector<SVGCircleElement>('.ring')!;
  app.input.onHold(
    el,
    HOLD_MS,
    (f) => {
      ring.setAttribute('stroke-dashoffset', String(RING * (1 - f)));
      el.classList.toggle('holding', f > 0);
    },
    () => {
      ring.setAttribute('stroke-dashoffset', String(RING));
      el.classList.remove('holding');
      onUnlock();
    },
  );
}
