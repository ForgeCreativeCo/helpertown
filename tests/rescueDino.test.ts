import { describe, expect, it } from 'vitest';
import { DINOS } from '../src/content/dinos';
import { getLine } from '../src/content/lines';
import { EMERGENCIES, emergencyFor, RESCUE_VEHICLES } from '../src/content/rescue';
import { addFossil, awardBadge, nextFossil } from '../src/core/progress';
import { defaultSave, migrate } from '../src/core/storage';

describe('Rescue Station', () => {
  it('has one emergency per rescue vehicle', () => {
    expect(EMERGENCIES.map((e) => e.vehicle).sort()).toEqual([...RESCUE_VEHICLES].sort());
    expect(emergencyFor('ambulance').id).toBe('hurt');
  });

  it('reuses the garage lines to name a vehicle tapped by mistake', () => {
    for (const v of RESCUE_VEHICLES) expect(getLine(`garage.name.${v}`)).toBeDefined();
  });

  it('asks about each emergency in one sentence', () => {
    expect(getLine('rescue.ask.fire')!.text).toBe("There's a fire! Which truck do we need?");
  });

  it('awards badges', () => {
    const p = defaultSave().progress;
    awardBadge(p);
    expect(p.badges).toHaveLength(1);
  });
});

describe('Dino Dig', () => {
  it('names every dinosaur with an existing sticker line', () => {
    for (const d of DINOS) expect(getLine(`sticker.say.${d.nameSticker}`)).toBeDefined();
  });

  it('dinosaurs to dig up take turns', () => {
    const p = defaultSave().progress;
    expect(nextFossil(p)).toBe('rex');
    addFossil(p, 'rex');
    expect(nextFossil(p)).toBe('longNeck');
  });

  it('older saves start with no badges or fossils', () => {
    const out = migrate({ version: 2, progress: {} }).progress;
    expect(out.badges).toEqual([]);
    expect(out.fossils).toEqual([]);
  });

  it('reuses "You found it!" and the counting lines', () => {
    expect(getLine('letter.foundIt')).toBeDefined();
    expect(getLine('fixit.count.5')).toBeDefined();
  });
});
