/** The fixed logical stage everything is designed against. */
export const STAGE_W = 1280;
export const STAGE_H = 800;

export interface Fit {
  scale: number;
  /** CSS px offset of the stage's top-left corner inside the viewport. */
  offsetX: number;
  offsetY: number;
}

/** Scales the stage to fit the viewport, centered, preserving aspect ratio. */
export function fitStage(viewW: number, viewH: number): Fit {
  const scale = Math.min(viewW / STAGE_W, viewH / STAGE_H);
  return {
    scale,
    offsetX: (viewW - STAGE_W * scale) / 2,
    offsetY: (viewH - STAGE_H * scale) / 2,
  };
}

/** The part of logical space that's visible on screen, including letterbox areas. */
export function visibleLogicalRect(viewW: number, viewH: number): { x: number; y: number; w: number; h: number } {
  const { scale, offsetX, offsetY } = fitStage(viewW, viewH);
  return { x: -offsetX / scale, y: -offsetY / scale, w: viewW / scale, h: viewH / scale };
}

export class Stage {
  readonly viewport: HTMLElement;
  readonly el: HTMLElement;
  /** Full-stage cover used for fade transitions. Sits above every scene layer. */
  readonly fade: HTMLElement;
  fit: Fit = { scale: 1, offsetX: 0, offsetY: 0 };
  private listeners = new Set<(fit: Fit) => void>();

  constructor(viewport: HTMLElement) {
    this.viewport = viewport;
    this.el = document.createElement('div');
    this.el.id = 'stage';
    this.fade = document.createElement('div');
    this.fade.id = 'fade';
    viewport.append(this.el);
    // The fade cover lives in the viewport, not the stage, so it also covers the letterbox.
    viewport.append(this.fade);
    const onResize = () => this.layout();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('fullscreenchange', onResize);
    this.layout();
  }

  layout(): void {
    const w = this.viewport.clientWidth || window.innerWidth;
    const h = this.viewport.clientHeight || window.innerHeight;
    this.fit = fitStage(w, h);
    const { scale, offsetX, offsetY } = this.fit;
    this.el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    for (const fn of this.listeners) fn(this.fit);
  }

  onLayout(fn: (fit: Fit) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Sets the color behind the stage, shown in any letterbox the scene art doesn't reach. */
  setBackdrop(color: string): void {
    this.viewport.style.setProperty('--backdrop', color);
  }

  /** Converts a client (CSS px) point to logical stage coordinates. */
  toLogical(clientX: number, clientY: number): { x: number; y: number } {
    const { scale, offsetX, offsetY } = this.fit;
    return { x: (clientX - offsetX) / scale, y: (clientY - offsetY) / scale };
  }

  /** Converts a logical stage point to client (CSS px) coordinates. */
  toClient(x: number, y: number): { x: number; y: number } {
    const { scale, offsetX, offsetY } = this.fit;
    return { x: x * scale + offsetX, y: y * scale + offsetY };
  }
}
