/**
 * Pure rules for deciding whether a pointerdown counts as a tap.
 * Kept free of the DOM so the mash-proof behavior is unit-tested.
 */
export interface GateConfig {
  /** A pointerdown this close (ms) to another one is part of a palm burst. */
  burstMs: number;
  /** Repeat taps on the same target within this window (ms) are ignored. */
  debounceMs: number;
  /** Touches reporting a contact larger than this (CSS px) are palms. */
  maxContact: number;
  /** Touches within this distance (CSS px) of the screen edge are ignored. */
  edge: number;
}

export const DEFAULT_GATE: GateConfig = { burstMs: 80, debounceMs: 400, maxContact: 70, edge: 40 };

export interface PointerSample {
  id: number;
  t: number;
  x: number;
  y: number;
  /** Contact size; 0 or 1 when the device doesn't report it. */
  width: number;
  height: number;
  pointerType: string;
  viewW: number;
  viewH: number;
}

export type RejectReason = 'burst' | 'contact' | 'edge' | 'debounce' | 'locked' | 'no-target' | 'disabled';

export class TapGate {
  private lastDownAt = -Infinity;
  private lastTapByTarget = new Map<string, number>();
  private active = new Set<number>();
  private cfg: GateConfig;

  constructor(cfg: GateConfig = DEFAULT_GATE) {
    this.cfg = cfg;
  }

  /** Records a pointerdown and returns a reason to reject it, or null if it may become a tap. */
  down(p: PointerSample, edgeExempt = false): RejectReason | null {
    const sinceLast = p.t - this.lastDownAt;
    this.lastDownAt = p.t;
    this.active.add(p.id);
    // Several fingers or a palm land within a few ms of each other: ignore all but the first.
    if (sinceLast < this.cfg.burstMs) return 'burst';
    if (p.pointerType === 'touch' && (p.width > this.cfg.maxContact || p.height > this.cfg.maxContact)) {
      return 'contact';
    }
    if (!edgeExempt) {
      const e = this.cfg.edge;
      if (p.x < e || p.y < e || p.x > p.viewW - e || p.y > p.viewH - e) return 'edge';
    }
    return null;
  }

  /** Call once a target is known; returns 'debounce' for a repeat tap on the same target. */
  claim(targetId: string, t: number): RejectReason | null {
    const prev = this.lastTapByTarget.get(targetId);
    if (prev !== undefined && t - prev < this.cfg.debounceMs) return 'debounce';
    this.lastTapByTarget.set(targetId, t);
    return null;
  }

  up(id: number): void {
    this.active.delete(id);
  }

  /** Number of pointers currently down (palms included). */
  get activeCount(): number {
    return this.active.size;
  }

  reset(): void {
    this.active.clear();
    this.lastTapByTarget.clear();
    this.lastDownAt = -Infinity;
  }
}
