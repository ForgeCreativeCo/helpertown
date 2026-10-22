import type { SfxName } from '../core/audio/sfx';

export type ToolId = 'hammer' | 'wrench' | 'screwdriver' | 'saw' | 'drill' | 'pump' | 'paintbrush';

export interface Tool {
  id: ToolId;
  /** Spoken name, as it appears inside lines ("Pops needs the {tool}!"). */
  name: string;
  /** Main color. */
  color: string;
  /** The sound it makes when Pops uses it. */
  sfx: SfxName;
}

/** In introduction order: the first three are always available. */
export const TOOLS: readonly Tool[] = [
  { id: 'hammer', name: 'hammer', color: '#e4473b', sfx: 'bang' },
  { id: 'wrench', name: 'wrench', color: '#3d7fe0', sfx: 'ratchet' },
  { id: 'screwdriver', name: 'screwdriver', color: '#f2b33d', sfx: 'whirr' },
  { id: 'saw', name: 'saw', color: '#3fae5a', sfx: 'zip' },
  { id: 'drill', name: 'drill', color: '#f07f2a', sfx: 'buzz' },
  { id: 'pump', name: 'air pump', color: '#8b5cd6', sfx: 'puff' },
  { id: 'paintbrush', name: 'paintbrush', color: '#e85fa4', sfx: 'swish' },
];

export function getTool(id: ToolId): Tool {
  return TOOLS.find((t) => t.id === id)!;
}

export const STARTER_TOOLS = 3;
