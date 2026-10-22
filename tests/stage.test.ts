import { describe, expect, it } from 'vitest';
import { fitStage, visibleLogicalRect } from '../src/core/stage';

describe('fitStage', () => {
  it('fills an exact 16:10 screen', () => {
    expect(fitStage(1920, 1200)).toEqual({ scale: 1.5, offsetX: 0, offsetY: 0 });
  });

  it('letterboxes a wider Fire 7 screen left and right', () => {
    const f = fitStage(1024, 600);
    expect(f.scale).toBeCloseTo(0.75);
    expect(f.offsetY).toBe(0);
    expect(f.offsetX).toBeCloseTo(32);
  });

  it('reports the visible logical area including letterbox', () => {
    const r = visibleLogicalRect(1024, 600);
    expect(r.y).toBeCloseTo(0);
    expect(r.h).toBeCloseTo(800);
    expect(r.x).toBeCloseTo(-42.67, 1);
    expect(r.w).toBeCloseTo(1365.33, 1);
  });
});
