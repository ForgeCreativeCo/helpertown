import type { App } from '../core/scenes';
import { resetSession } from '../core/session';
import { localDate } from '../core/storage';
import { showCheck } from './checkScreen';
import { mountGear } from './gear';
import { openMenu } from './menu';

/**
 * Hold the gear 3 s → grown-ups check → parent menu. The game stops behind the
 * menu; closing it starts a fresh session back on the town map.
 */
export function mountParent(app: App): void {
  mountGear(app, () => void open(app));
}

async function open(app: App): Promise<void> {
  if (app.parentOpen) return;
  app.parentOpen = true;
  app.input.lock();
  app.audio.clearQueue();
  const ok = await showCheck();
  if (!ok) {
    app.parentOpen = false;
    app.input.unlock();
    return;
  }
  app.audio.pauseMusic(true);
  app.scenes.go('paused', { instant: true, queue: true });
  openMenu(app, () => {
    resetSession(app.store.progress, localDate());
    app.store.save();
    app.parentOpen = false;
    app.input.unlock();
    app.audio.pauseMusic(false);
    app.scenes.go('town', { params: { greet: true }, queue: true });
  });
}
