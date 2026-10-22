import { describe, expect, it } from 'vitest';
import { getProblem, PROBLEMS } from '../src/content/problems';
import { TOOLS } from '../src/content/tools';
import { getVehicle, VEHICLES, type VehicleId } from '../src/content/vehicles';
import { planFixRound } from '../src/core/fixPlan';
import { recordFix } from '../src/core/progress';
import { defaultSave } from '../src/core/storage';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const ALL_TOOLS = TOOLS.map((t) => t.id);
const STARTERS = ['hammer', 'wrench', 'screwdriver'] as const;

describe('content', () => {
  it('every tool fixes exactly one problem', () => {
    expect(PROBLEMS.map((p) => p.tool).sort()).toEqual([...ALL_TOOLS].sort());
  });
});

describe('planFixRound', () => {
  it('makes 3 jobs with different problems and different vehicles', () => {
    for (let seed = 1; seed < 200; seed++) {
      const jobs = planFixRound(ALL_TOOLS, [], seeded(seed));
      expect(jobs).toHaveLength(3);
      expect(new Set(jobs.map((j) => j.problem)).size).toBe(3);
      expect(new Set(jobs.map((j) => j.vehicle)).size).toBe(3);
    }
  });

  it('only uses problems fixed by tools he knows', () => {
    for (let seed = 1; seed < 50; seed++) {
      for (const job of planFixRound(STARTERS, [], seeded(seed))) {
        expect(STARTERS).toContain(getProblem(job.problem).tool);
      }
    }
  });

  it('never gives a tracked vehicle a tire problem', () => {
    for (let seed = 1; seed < 300; seed++) {
      for (const job of planFixRound(ALL_TOOLS, [], seeded(seed))) {
        if (getProblem(job.problem).needsWheels) expect(getVehicle(job.vehicle).wheeled).toBe(true);
      }
    }
  });

  it('prefers vehicles not in the garage yet', () => {
    const owned: VehicleId[] = ['dumpTruck', 'excavator', 'bulldozer', 'cementMixer', 'fireTruck'];
    for (let seed = 1; seed < 50; seed++) {
      const jobs = planFixRound(ALL_TOOLS, owned, seeded(seed));
      expect(jobs.filter((j) => !owned.includes(j.vehicle))).toHaveLength(3);
    }
  });

  it('still works once every vehicle is collected', () => {
    const jobs = planFixRound(
      ALL_TOOLS,
      VEHICLES.map((v) => v.id),
      seeded(5),
    );
    expect(jobs).toHaveLength(3);
  });
});

describe('garage', () => {
  it('parks a new vehicle, then adds stars for repeats', () => {
    const p = defaultSave().progress;
    expect(recordFix(p, 'towTruck')).toBe('new');
    expect(recordFix(p, 'towTruck')).toBe('star');
    expect(recordFix(p, 'towTruck')).toBe('star');
    expect(p.garage.towTruck).toEqual({ stars: 2 });
  });
});
