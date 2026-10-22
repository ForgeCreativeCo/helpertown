import type { ToolId } from './tools';

export type ProblemId = 'flatTire' | 'looseWheel' | 'dent' | 'looseScrew' | 'branch' | 'missingLight' | 'scratch';

export interface Problem {
  id: ProblemId;
  /** The one tool that fixes it. */
  tool: ToolId;
  /** Spoken as its own sentence after "Uh oh!", e.g. "The tire is flat!". */
  sentence: string;
  /** Only vehicles on tires can have it. */
  needsWheels: boolean;
}

/** One problem per tool, so every tool gets a job in the repair bay. */
export const PROBLEMS: readonly Problem[] = [
  { id: 'dent', tool: 'hammer', sentence: "There's a big dent!", needsWheels: false },
  { id: 'looseWheel', tool: 'wrench', sentence: 'The wheel is wobbly!', needsWheels: true },
  { id: 'looseScrew', tool: 'screwdriver', sentence: 'The door is rattling!', needsWheels: false },
  { id: 'branch', tool: 'saw', sentence: 'A branch is stuck on top!', needsWheels: false },
  { id: 'missingLight', tool: 'drill', sentence: 'A light fell off!', needsWheels: false },
  { id: 'flatTire', tool: 'pump', sentence: 'The tire is flat!', needsWheels: true },
  { id: 'scratch', tool: 'paintbrush', sentence: 'The paint is scratched!', needsWheels: false },
];

export function getProblem(id: ProblemId): Problem {
  return PROBLEMS.find((p) => p.id === id)!;
}
