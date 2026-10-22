import type { Audio, SfxName, SpeakOptions, SpeakResult } from './audio';
import { celebrate, type CelebrateOptions } from './celebrate';
import { choiceCount, recordAnswer, startRound, type Track } from './difficulty';
import type { Input, TapEvent, TapOptions } from './input';
import { getTrack, setTrack } from './progress';
import type { Stage } from './stage';
import type { Progress, Store } from './storage';

/** Adaptive difficulty tracks, stored in progress. */
export interface DifficultyApi {
  track(key: string, min: number, max: number): Track;
  startRound(key: string, min: number, max: number): void;
  /** Records a question's first-try result and returns the updated track. */
  record(key: string, min: number, max: number, firstTry: boolean): Track;
  /** Choices to show (2..4) for a track, honoring a parent's fixed level. */
  choices(key: string): number;
}

function difficultyApi(store: Store): DifficultyApi {
  const update = (key: string, min: number, max: number, fn: (t: Track) => Track) => {
    const t = fn(getTrack(store.progress, key, min, max));
    store.update((d) => setTrack(d.progress, key, t));
    return t;
  };
  return {
    track: (key, min, max) => getTrack(store.progress, key, min, max),
    startRound: (key, min, max) => void update(key, min, max, startRound),
    record: (key, min, max, firstTry) => update(key, min, max, (t) => recordAnswer(t, firstTry)),
    choices: (key) => choiceCount(getTrack(store.progress, key, 2, 4), store.settings.difficulty),
  };
}

/** Shared services every scene can reach through its context. */
export interface App {
  stage: Stage;
  input: Input;
  audio: Audio;
  store: Store;
  scenes: SceneManager;
  /** True while the grown-ups check or parent menu is open (play time doesn't count). */
  parentOpen: boolean;
}

/**
 * What a scene gets when it mounts. Everything registered through it (taps,
 * timers, animations, waits) is torn down automatically on unmount, and async
 * flows simply stop: promises from a dead context never resolve.
 */
export interface SceneContext {
  readonly app: App;
  /** The scene's own layer inside the stage. */
  readonly root: HTMLElement;
  readonly params: Record<string, unknown>;
  readonly alive: boolean;
  speak(lineId: string, opts?: SpeakOptions): Promise<SpeakResult>;
  sfx(name: SfxName): void;
  /** End-of-round confetti, cheering Pops, and the reward flying home. */
  celebrate(opts: CelebrateOptions): Promise<void>;
  /** Saved progress (mutate, then call save()). */
  readonly progress: Progress;
  save(): void;
  readonly difficulty: DifficultyApi;
  /** Makes an element tappable; returns a function that removes it early. */
  tap(el: Element, fn: (e: TapEvent) => void, opts?: TapOptions): () => void;
  setEnabled(el: Element, enabled: boolean): void;
  hold(el: Element, ms: number, onProgress: (f: number) => void, onComplete: () => void): void;
  /** Called on every accepted tap while this scene is up. */
  onAnyTap(fn: () => void): () => void;
  /** Scoped setTimeout; returns a cancel function. */
  after(ms: number, fn: () => void): () => void;
  wait(ms: number): Promise<void>;
  /** Tracks a looping animation so it's cancelled on unmount. */
  keep(a: Animation): Animation;
  /** Runs fn on unmount. */
  onCleanup(fn: () => void): void;
  /** Wraps a promise so it never resolves once the scene is gone. */
  guard<T>(p: Promise<T>): Promise<T>;
  go(sceneId: string, opts?: GoOptions): void;
}

export type { CelebrateOptions };

export interface Scene {
  /** Color shown behind the stage in letterbox areas. */
  backdrop?: string;
  mount(ctx: SceneContext): void;
  unmount?(): void;
}

export type SceneFactory = () => Scene;

export interface GoOptions {
  params?: Record<string, unknown>;
  /** Logical point the old scene zooms toward (the thing that was tapped). */
  from?: { x: number; y: number };
  /** Skip the transition (first scene only). */
  instant?: boolean;
  /** If a transition is running, go once it ends instead of ignoring the call. */
  queue?: boolean;
}

interface Mounted {
  scene: Scene;
  ctx: SceneContext;
  layer: HTMLElement;
  cleanup: () => void;
}

const OUT_MS = 380;
const IN_MS = 320;

export class SceneManager {
  private factories = new Map<string, SceneFactory>();
  private current: Mounted | null = null;
  private transitioning = false;
  private pending: { id: string; opts: GoOptions } | null = null;
  private app!: App;
  currentId: string | null = null;

  bind(app: App): void {
    this.app = app;
  }

  register(id: string, factory: SceneFactory): void {
    this.factories.set(id, factory);
  }

  get busy(): boolean {
    return this.transitioning;
  }

  /**
   * Changes scene. Calls made while a transition is running are ignored
   * (mash-proof), unless `queue` is set: then it runs once the transition ends.
   */
  go(id: string, opts: GoOptions = {}): void {
    if (this.transitioning) {
      if (opts.queue) this.pending = { id, opts };
      return;
    }
    const factory = this.factories.get(id);
    if (!factory) {
      console.error(`Unknown scene: ${id}`);
      return;
    }
    this.transitioning = true;
    const { input } = this.app;
    input.lock();
    void this.run(id, factory, opts).finally(() => {
      this.transitioning = false;
      input.unlock();
      const next = this.pending;
      this.pending = null;
      if (next) this.go(next.id, next.opts);
    });
  }

  private async run(id: string, factory: SceneFactory, opts: GoOptions): Promise<void> {
    const { stage } = this.app;
    const old = this.current;
    if (old && !opts.instant) {
      const fade = this.fadeCover(0, 1, OUT_MS, 'ease-in');
      if (opts.from) {
        old.layer.style.transformOrigin = `${opts.from.x}px ${opts.from.y}px`;
        old.layer.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.8)' }], {
          duration: OUT_MS,
          easing: 'ease-in',
          fill: 'forwards',
        });
      }
      await fade;
    }
    if (old) this.teardown(old);

    let mounted: Mounted;
    try {
      mounted = this.mount(id, factory, opts.params ?? {});
    } catch (err) {
      // A scene that fails to build must not leave the screen covered and locked.
      console.error(err);
      if (id !== 'hub' && this.factories.has('hub')) mounted = this.mount('hub', this.factories.get('hub')!, {});
      else throw err;
    }
    this.current = mounted;
    if (mounted.scene.backdrop) stage.setBackdrop(mounted.scene.backdrop);

    if (old && !opts.instant) await this.fadeCover(1, 0, IN_MS, 'ease-out');
  }

  /**
   * Fades the cover and then sets its opacity for real, so finished animations
   * never pile up. A watchdog ends the step even if the animation never reports
   * finishing (throttled tab), so a transition can't hang with input locked.
   */
  private fadeCover(from: number, to: number, ms: number, easing: string): Promise<void> {
    const cover = this.app.stage.fade;
    const anim = cover.animate([{ opacity: from }, { opacity: to }], { duration: ms, easing });
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(watchdog);
        cover.style.opacity = String(to);
        anim.cancel();
        resolve();
      };
      const watchdog = setTimeout(done, ms + 400);
      anim.finished.then(done, done);
    });
  }

  private mount(id: string, factory: SceneFactory, params: Record<string, unknown>): Mounted {
    const { stage, input, audio, store } = this.app;
    const layer = document.createElement('div');
    layer.className = 'layer';
    stage.el.append(layer);

    let alive = true;
    const cleanups: (() => void)[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const anims = new Set<Animation>();
    const never = new Promise<never>(() => undefined);
    const guard = <T>(p: Promise<T>): Promise<T> => p.then((v) => (alive ? v : never));

    const ctx: SceneContext = {
      app: this.app,
      root: layer,
      params,
      get alive() {
        return alive;
      },
      speak: (lineId, o) => guard(audio.speak(lineId, o)),
      sfx: (name) => audio.sfx(name),
      celebrate: (o) => guard(celebrate(ctx, o)),
      get progress() {
        return store.progress;
      },
      save: () => store.save(),
      difficulty: difficultyApi(store),
      tap: (el, fn, o) => {
        const off = input.onTap(el, fn, o);
        cleanups.push(off);
        return off;
      },
      setEnabled: (el, enabled) => input.setEnabled(el, enabled),
      hold: (el, ms, p, c) => void cleanups.push(input.onHold(el, ms, p, c)),
      onAnyTap: (fn) => {
        const off = input.onAnyTap(fn);
        cleanups.push(off);
        return off;
      },
      after: (ms, fn) => {
        const t = setTimeout(() => {
          timers.delete(t);
          if (alive) fn();
        }, ms);
        timers.add(t);
        return () => {
          clearTimeout(t);
          timers.delete(t);
        };
      },
      wait: (ms) => guard(new Promise<void>((r) => void ctx.after(ms, r))),
      keep: (a) => {
        anims.add(a);
        return a;
      },
      onCleanup: (fn) => cleanups.push(fn),
      guard,
      go: (sceneId, o) => {
        if (alive) this.go(sceneId, o);
      },
    };

    const scene = factory();
    this.currentId = id;
    const mounted: Mounted = {
      scene,
      ctx,
      layer,
      cleanup: () => {
        alive = false;
        for (const t of timers) clearTimeout(t);
        for (const a of anims) a.cancel();
        for (const fn of cleanups.splice(0)) {
          try {
            fn();
          } catch (err) {
            console.error(err);
          }
        }
        audio.clearQueue();
      },
    };
    try {
      scene.mount(ctx);
    } catch (err) {
      mounted.cleanup();
      layer.remove();
      throw err;
    }
    return mounted;
  }

  private teardown(m: Mounted): void {
    try {
      m.scene.unmount?.();
    } catch (err) {
      console.error(err);
    }
    m.cleanup();
    m.layer.remove();
  }
}
