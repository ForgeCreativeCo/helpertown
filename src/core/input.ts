import { TapGate, type PointerSample, type RejectReason } from './tapGate';

export interface TapEvent {
  /** Logical stage coordinates. */
  x: number;
  y: number;
  target: Element;
}

export interface TapOptions {
  /** Taps here are allowed in the outer edge zone (the parent gear). */
  edgeExempt?: boolean;
  /** Ignore the input lock (for controls that must work during transitions). */
  ignoreLock?: boolean;
}

interface Target {
  id: string;
  el: Element;
  onTap: (e: TapEvent) => void;
  opts: TapOptions;
  enabled: boolean;
}

interface HoldTarget {
  el: Element;
  ms: number;
  onProgress: (fraction: number) => void;
  onComplete: () => void;
}

let nextId = 1;

/**
 * The one place pointer input enters the game. Responds on pointerdown and
 * enforces the mash-proof rules: palm bursts, big contacts, edge touches,
 * per-target debounce, and a lock while scenes change.
 */
export class Input {
  private gate = new TapGate();
  private targets = new Map<string, Target>();
  private holds = new Map<Element, HoldTarget>();
  private lockCount = 0;
  private anyTap = new Set<() => void>();
  private activeHold: { pointerId: number; target: HoldTarget; raf: number } | null = null;
  private debugLayer: HTMLElement | null = null;
  private toLogical: (x: number, y: number) => { x: number; y: number };

  constructor(root: HTMLElement, toLogical: (x: number, y: number) => { x: number; y: number }) {
    this.toLogical = toLogical;
    const opts = { capture: true, passive: false } as const;
    root.addEventListener('pointerdown', (e) => this.onDown(e), opts);
    root.addEventListener('pointerup', (e) => this.onUp(e), opts);
    root.addEventListener('pointercancel', (e) => this.onUp(e), opts);
    root.addEventListener('pointermove', (e) => this.onMove(e), opts);
    // No long-press menus, double-tap zoom, pinch, text selection or dragging.
    const block = (e: Event) => e.preventDefault();
    for (const type of ['contextmenu', 'dblclick', 'gesturestart', 'gesturechange', 'selectstart', 'dragstart']) {
      document.addEventListener(type, block, { passive: false });
    }
    document.addEventListener('touchmove', block, { passive: false });
    document.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 1) e.preventDefault();
      },
      { passive: false },
    );
  }

  /** Makes an element tappable. Returns a function that removes it. */
  onTap(el: Element, onTap: (e: TapEvent) => void, opts: TapOptions = {}): () => void {
    const id = `t${nextId++}`;
    el.setAttribute('data-tap', id);
    this.targets.set(id, { id, el, onTap, opts, enabled: true });
    return () => {
      this.targets.delete(id);
      if (el.getAttribute('data-tap') === id) el.removeAttribute('data-tap');
    };
  }

  /** Turns a target on or off without unregistering it. */
  setEnabled(el: Element, enabled: boolean): void {
    const id = el.getAttribute('data-tap');
    const t = id ? this.targets.get(id) : undefined;
    if (t) t.enabled = enabled;
  }

  /**
   * A press-and-hold control (only the parent gear uses this). A second finger,
   * lifting, or sliding off cancels it.
   */
  onHold(el: Element, ms: number, onProgress: (f: number) => void, onComplete: () => void): () => void {
    el.setAttribute('data-hold', '');
    this.holds.set(el, { el, ms, onProgress, onComplete });
    return () => {
      this.holds.delete(el);
      el.removeAttribute('data-hold');
      if (this.activeHold?.target.el === el) this.cancelHold();
    };
  }

  /** Called on every accepted tap anywhere (idle timers listen to this). */
  onAnyTap(fn: () => void): () => void {
    this.anyTap.add(fn);
    return () => this.anyTap.delete(fn);
  }

  /** Ignore input until the matching unlock(). Nested locks stack. */
  lock(): void {
    this.lockCount++;
  }

  unlock(): void {
    this.lockCount = Math.max(0, this.lockCount - 1);
  }

  get locked(): boolean {
    return this.lockCount > 0;
  }

  /** Shows a dot for every pointerdown: green for taps, grey for rejected touches. */
  enableDebug(layer: HTMLElement): void {
    this.debugLayer = layer;
  }

  private sample(e: PointerEvent): PointerSample {
    return {
      id: e.pointerId,
      t: e.timeStamp,
      x: e.clientX,
      y: e.clientY,
      width: e.width,
      height: e.height,
      pointerType: e.pointerType,
      viewW: window.innerWidth,
      viewH: window.innerHeight,
    };
  }

  private onDown(e: PointerEvent): void {
    e.preventDefault();
    const p = this.sample(e);
    const el = e.target instanceof Element ? e.target : null;
    const holdEl = el?.closest('[data-hold]');
    const tapEl = el?.closest('[data-tap]');
    const target = tapEl ? this.targets.get(tapEl.getAttribute('data-tap') ?? '') : undefined;
    const edgeExempt = !!holdEl || !!target?.opts.edgeExempt;

    // Any extra finger cancels a hold in progress, so palms can't finish one.
    if (this.activeHold) {
      this.gate.down(p, edgeExempt);
      this.cancelHold();
      this.dot(p, 'disabled');
      return;
    }

    let reason: RejectReason | null = this.gate.down(p, edgeExempt);
    if (!reason && holdEl) {
      const hold = this.holds.get(holdEl);
      if (hold && this.gate.activeCount === 1) {
        this.startHold(e.pointerId, hold);
        this.dot(p, null);
        return;
      }
      reason = 'disabled';
    }
    if (!reason && !target) reason = 'no-target';
    if (!reason && target && !target.enabled) reason = 'disabled';
    if (!reason && target && this.locked && !target.opts.ignoreLock) reason = 'locked';
    if (!reason && target) reason = this.gate.claim(target.id, p.t);
    this.dot(p, reason);
    if (reason || !target) return;

    const logical = this.toLogical(p.x, p.y);
    for (const fn of this.anyTap) fn();
    try {
      target.onTap({ x: logical.x, y: logical.y, target: target.el });
    } catch (err) {
      // A broken handler must never take the whole input layer down with it.
      console.error(err);
    }
  }

  private onUp(e: PointerEvent): void {
    this.gate.up(e.pointerId);
    if (this.activeHold?.pointerId === e.pointerId) this.cancelHold();
  }

  private onMove(e: PointerEvent): void {
    const hold = this.activeHold;
    if (!hold || hold.pointerId !== e.pointerId) return;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    if (!under || !hold.target.el.contains(under)) this.cancelHold();
  }

  private startHold(pointerId: number, target: HoldTarget): void {
    const start = performance.now();
    const step = () => {
      if (!this.activeHold) return;
      const f = Math.min(1, (performance.now() - start) / target.ms);
      target.onProgress(f);
      if (f >= 1) {
        this.activeHold = null;
        target.onComplete();
        return;
      }
      this.activeHold.raf = requestAnimationFrame(step);
    };
    this.activeHold = { pointerId, target, raf: requestAnimationFrame(step) };
  }

  private cancelHold(): void {
    if (!this.activeHold) return;
    cancelAnimationFrame(this.activeHold.raf);
    this.activeHold.target.onProgress(0);
    this.activeHold = null;
  }

  private dot(p: PointerSample, reason: RejectReason | null): void {
    if (!this.debugLayer) return;
    const d = document.createElement('div');
    d.className = 'debug-dot';
    d.style.left = `${p.x}px`;
    d.style.top = `${p.y}px`;
    d.style.borderColor = reason ? '#9a9a9a' : '#2ecc40';
    if (reason) d.title = reason;
    this.debugLayer.append(d);
    d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => d.remove();
  }
}
