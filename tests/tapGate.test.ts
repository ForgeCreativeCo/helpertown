import { describe, expect, it } from 'vitest';
import { TapGate, type PointerSample } from '../src/core/tapGate';

let nextId = 1;
function p(t: number, over: Partial<PointerSample> = {}): PointerSample {
  return { id: nextId++, t, x: 500, y: 400, width: 20, height: 20, pointerType: 'touch', viewW: 1280, viewH: 800, ...over };
}

describe('TapGate', () => {
  it('accepts a normal tap', () => {
    const g = new TapGate();
    expect(g.down(p(1000))).toBeNull();
    expect(g.claim('a', 1000)).toBeNull();
  });

  it('rejects the rest of a palm burst', () => {
    const g = new TapGate();
    expect(g.down(p(1000))).toBeNull();
    expect(g.down(p(1030))).toBe('burst');
    expect(g.down(p(1060))).toBe('burst');
  });

  it('still accepts a real tap while a palm rests on the screen', () => {
    const g = new TapGate();
    const palm = p(1000, { width: 120, height: 140 });
    expect(g.down(palm)).toBe('contact');
    expect(g.activeCount).toBe(1);
    expect(g.down(p(2000))).toBeNull();
  });

  it('ignores touches in the edge zone unless exempt', () => {
    const g = new TapGate();
    expect(g.down(p(1000, { x: 20 }))).toBe('edge');
    expect(g.down(p(2000, { y: 790 }))).toBe('edge');
    expect(g.down(p(3000, { x: 10, y: 10 }), true)).toBeNull();
  });

  it('ignores contact size for mouse pointers', () => {
    const g = new TapGate();
    expect(g.down(p(1000, { pointerType: 'mouse', width: 200, height: 200 }))).toBeNull();
  });

  it('debounces repeat taps on the same target only', () => {
    const g = new TapGate();
    expect(g.claim('a', 1000)).toBeNull();
    expect(g.claim('a', 1300)).toBe('debounce');
    expect(g.claim('b', 1300)).toBeNull();
    expect(g.claim('a', 1450)).toBeNull();
  });

  it('tracks active pointers', () => {
    const g = new TapGate();
    const a = p(1000);
    const b = p(2000);
    g.down(a);
    g.down(b);
    expect(g.activeCount).toBe(2);
    g.up(a.id);
    expect(g.activeCount).toBe(1);
  });
});
