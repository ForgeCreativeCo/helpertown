export type VehicleId =
  | 'dumpTruck'
  | 'excavator'
  | 'bulldozer'
  | 'cementMixer'
  | 'fireTruck'
  | 'ambulance'
  | 'policeCar'
  | 'towTruck';

export interface Vehicle {
  id: VehicleId;
  /** Spoken name. */
  name: string;
  color: string;
  /** Rolls on tires (tracked vehicles can't get a flat or a loose wheel). */
  wheeled: boolean;
  /** How it tests itself once fixed. */
  test: 'honk' | 'siren';
}

export const VEHICLES: readonly Vehicle[] = [
  { id: 'dumpTruck', name: 'dump truck', color: '#f2b33d', wheeled: true, test: 'honk' },
  { id: 'excavator', name: 'excavator', color: '#f07f2a', wheeled: false, test: 'honk' },
  { id: 'bulldozer', name: 'bulldozer', color: '#f5c518', wheeled: false, test: 'honk' },
  { id: 'cementMixer', name: 'cement mixer', color: '#3d7fe0', wheeled: true, test: 'honk' },
  { id: 'fireTruck', name: 'fire truck', color: '#e4473b', wheeled: true, test: 'siren' },
  { id: 'ambulance', name: 'ambulance', color: '#f4f4f4', wheeled: true, test: 'siren' },
  { id: 'policeCar', name: 'police car', color: '#2b4fa0', wheeled: true, test: 'siren' },
  { id: 'towTruck', name: 'tow truck', color: '#3fae5a', wheeled: true, test: 'honk' },
];

export function getVehicle(id: VehicleId): Vehicle {
  return VEHICLES.find((v) => v.id === id)!;
}
