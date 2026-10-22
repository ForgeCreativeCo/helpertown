import './styles.css';
import { family } from './config/family';
import { Audio } from './core/audio';
import { Input } from './core/input';
import { SceneManager, type App } from './core/scenes';
import { Stage } from './core/stage';
import { Store } from './core/storage';
import { fetchScene } from './scenes/fetch';
import { fixitScene } from './scenes/fixit';
import { hubScene } from './scenes/hub';
import { startScene } from './scenes/start';

function boot(): void {
  const viewport = document.getElementById('viewport')!;
  const stage = new Stage(viewport);
  const input = new Input(viewport, (x, y) => stage.toLogical(x, y));
  const store = new Store();
  const audio = new Audio();
  const scenes = new SceneManager();
  const app: App = { stage, input, audio, store, scenes };

  const { settings } = store;
  audio.setVolumes(settings.voiceVolume, settings.sfxVolume);
  // A save from before the name was set holds '', so fall back to the family config.
  audio.setNames({ child: settings.childName || family.childName, grandpa: settings.grandpaName });
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

  scenes.bind(app);
  scenes.register('start', startScene);
  scenes.register('hub', hubScene);
  scenes.register('fetch', fetchScene);
  scenes.register('fixit', fixitScene);

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

boot();
