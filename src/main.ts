import './styles.css';
import { Audio } from './core/audio';
import { Input } from './core/input';
import { SceneManager, type App } from './core/scenes';
import { addPlay, isResting } from './core/session';
import { Stage } from './core/stage';
import { localDate, Store } from './core/storage';
import { mountParent } from './parent';
import { bakeScene } from './scenes/bake';
import { bakeryScene } from './scenes/bakery';
import { cookScene } from './scenes/cook';
import { decorateScene } from './scenes/decorate';
import { fetchScene } from './scenes/fetch';
import { fixitScene } from './scenes/fixit';
import { garageScene } from './scenes/garage';
import { housesScene } from './scenes/houses';
import { hubScene } from './scenes/hub';
import { kitchenScene } from './scenes/kitchen';
import { lettersScene } from './scenes/letters';
import { namesignScene } from './scenes/namesign';
import { postScene } from './scenes/post';
import { pausedScene, restScene } from './scenes/rest';
import { startScene } from './scenes/start';
import { toolwallScene } from './scenes/toolwall';
import { townScene } from './scenes/town';

/** Play only counts if he tapped within this long (idle time doesn't count). */
const ACTIVE_WINDOW_MS = 60_000;

function boot(): void {
  const viewport = document.getElementById('viewport')!;
  const stage = new Stage(viewport);
  const input = new Input(viewport, (x, y) => stage.toLogical(x, y));
  const store = new Store();
  const audio = new Audio();
  const scenes = new SceneManager();
  const app: App = { stage, input, audio, store, scenes, parentOpen: false };

  const { settings } = store;
  audio.setVolumes(settings.voiceVolume, settings.sfxVolume);
  audio.setNames({ child: settings.childName, grandpa: settings.grandpaName });
  audio.setMusic(settings.music);
  void audio.refreshParentRecordings();
  input.onAnyTap(() => audio.wake());

  // `?debug` shows a dot for every touch: green taps, grey rejected touches.
  if (new URLSearchParams(location.search).has('debug')) {
    const dots = document.createElement('div');
    dots.id = 'debug-dots';
    viewport.append(dots);
    input.enableDebug(dots);
    audio.debug = true;
    (window as unknown as { helperTown: App }).helperTown = app;
  }

  // `?fps` shows frames per second and the slowest frame, for checking on the tablet.
  if (new URLSearchParams(location.search).has('fps')) showFps(viewport);

  // The play clock: counts active play toward today's total and the session.
  let ticks = 0;
  setInterval(() => {
    if (document.hidden || app.parentOpen || !input.lastTapAt) return;
    if (performance.now() - input.lastTapAt > ACTIVE_WINDOW_MS) return;
    const today = localDate();
    if (isResting(store.progress, today)) return;
    addPlay(store.progress, 1000, today);
    if (++ticks % 10 === 0) store.save();
  }, 1000);

  scenes.bind(app);
  scenes.register('start', startScene);
  scenes.register('hub', hubScene);
  scenes.register('fetch', fetchScene);
  scenes.register('fixit', fixitScene);
  scenes.register('toolwall', toolwallScene);
  scenes.register('garage', garageScene);
  scenes.register('town', townScene);
  scenes.register('kitchen', kitchenScene);
  scenes.register('cook', cookScene);
  scenes.register('bake', bakeScene);
  scenes.register('decorate', decorateScene);
  scenes.register('bakery', bakeryScene);
  scenes.register('post', postScene);
  scenes.register('letters', lettersScene);
  scenes.register('namesign', namesignScene);
  scenes.register('houses', housesScene);
  scenes.register('rest', restScene);
  scenes.register('paused', pausedScene);
  mountParent(app);

  // Dev only: `?gallery` shows every piece of art for checking.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('gallery')) {
    void import('./scenes/gallery').then((m) => {
      scenes.register('gallery', m.galleryScene);
      scenes.go('gallery', { instant: true });
    });
    return;
  }
  scenes.go('start', { instant: true });
}

function showFps(viewport: HTMLElement): void {
  const el = document.createElement('div');
  el.id = 'fps';
  viewport.append(el);
  let frames = 0;
  let worst = 0;
  let last = performance.now();
  let windowStart = last;
  const tick = (now: number) => {
    frames++;
    worst = Math.max(worst, now - last);
    last = now;
    if (now - windowStart >= 1000) {
      el.textContent = `${Math.round((frames * 1000) / (now - windowStart))} fps · worst ${Math.round(worst)} ms`;
      frames = 0;
      worst = 0;
      windowStart = now;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

boot();
