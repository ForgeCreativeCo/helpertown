import { PROBLEMS, type ProblemId } from '../content/problems';
import type { ToolId } from '../content/tools';
import { VEHICLES, type VehicleId } from '../content/vehicles';
import { shuffle, type Rng } from './rounds';

export interface FixJob {
  vehicle: VehicleId;
  problem: ProblemId;
}

export const FIXES_PER_ROUND = 3;

/**
 * Plans a Fix It round: different problems, each fixed by a tool he already
 * knows, on different vehicles that can have that problem. Vehicles he hasn't
 * collected yet come first so his garage fills up.
 */
export function planFixRound(
  tools: readonly ToolId[],
  collected: readonly VehicleId[],
  rng: Rng = Math.random,
  count = FIXES_PER_ROUND,
): FixJob[] {
  const problems = shuffle(
    PROBLEMS.filter((p) => tools.includes(p.tool)),
    rng,
  ).slice(0, count);
  const used = new Set<VehicleId>();
  const jobs: FixJob[] = [];
  // Place the pickiest problems (tires only) first so they still find a vehicle.
  for (const problem of [...problems].sort((a, b) => Number(b.needsWheels) - Number(a.needsWheels))) {
    const fits = shuffle(
      VEHICLES.filter((v) => !used.has(v.id) && (!problem.needsWheels || v.wheeled)),
      rng,
    );
    const pick = fits.find((v) => !collected.includes(v.id)) ?? fits[0];
    if (!pick) continue;
    used.add(pick.id);
    jobs.push({ vehicle: pick.id, problem: problem.id });
  }
  return shuffle(jobs, rng);
}
