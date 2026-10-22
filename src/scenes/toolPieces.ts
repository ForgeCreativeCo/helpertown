import { toolArt, TOOL_SIZE } from '../art/tools';
import type { ToolId } from '../content/tools';
import { placeAt, popIn, type Place } from '../core/anim';
import type { Choice } from '../core/question';
import { lineId } from '../content/lines';
import type { SceneContext } from '../core/scenes';
import { s } from '../core/svg';

/** A tool laid out as a tappable choice (shared by Fetch the Tool and Fix It). */
export interface ToolPiece {
  id: ToolId;
  el: SVGGElement;
  art: SVGGElement;
  place: Place;
}

export const TOOL_ORIGIN = { x: TOOL_SIZE / 2, y: TOOL_SIZE / 2 };

export interface Row {
  left: number;
  right: number;
  y: number;
  /** Tool scale with 2–3 choices, and with 4. */
  scaleFew: number;
  scaleMany: number;
}

/** Evenly spaced slots along a row, each with a slight playful tilt. */
export function slotPlaces(n: number, row: Row): Place[] {
  const scale = n <= 3 ? row.scaleFew : row.scaleMany;
  const span = row.right - row.left;
  return Array.from({ length: n }, (_, i) => ({
    x: row.left + (span * (i + 0.5)) / n,
    y: row.y,
    scale,
    rot: [-8, 6, -4, 8][i] ?? 0,
  }));
}

export function makePieces(ids: ToolId[], row: Row): ToolPiece[] {
  const places = slotPlaces(ids.length, row);
  const spacing = (row.right - row.left) / ids.length;
  return ids.map((id, i) => {
    const place = places[i]!;
    const art = toolArt(id);
    art.setAttribute('class', 'tf');
    // Pad the hit area as far as the gap to the next tool allows (always 140+ px).
    const pad = Math.max(8, Math.min(30, (spacing / (place.scale ?? 1) - TOOL_SIZE) / 2));
    const hit = s('rect', {
      x: -pad,
      y: -pad,
      width: TOOL_SIZE + pad * 2,
      height: TOOL_SIZE + pad * 2,
      rx: 30,
      fill: 'transparent',
    });
    const el = s('g', {}, [hit, art]);
    placeAt(el, place, TOOL_ORIGIN);
    return { id, el, art, place };
  });
}

export function toolChoices(pieces: ToolPiece[], target: ToolId): Choice[] {
  return pieces.map((p) => ({
    el: p.el,
    art: p.art,
    correct: p.id === target,
    nameLine: lineId('fetch.thatsThe', p.id),
    glow: { cx: TOOL_ORIGIN.x, cy: TOOL_ORIGIN.y, r: 100 },
    center: { x: p.place.x, y: p.place.y },
  }));
}

/** Adds the pieces to the layer one after another with a little pop. */
export async function showPieces(ctx: SceneContext, layer: SVGGElement, pieces: ToolPiece[]): Promise<void> {
  for (const [i, p] of pieces.entries()) {
    ctx.after(i * 110, () => {
      layer.append(p.el);
      popIn(p.art);
      ctx.sfx('tap');
    });
  }
  await ctx.wait(pieces.length * 110 + 350);
}
