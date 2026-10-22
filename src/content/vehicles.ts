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
}

export const VEHICLES: readonly Vehicle[] = [
  { id: 'dumpTruck', name: 'dump truck', color: '#f2b33d' },
  { id: 'excavator', name: 'excavator', color: '#f07f2a' },
  { id: 'bulldozer', name: 'bulldozer', color: '#f5c518' },
  { id: 'cementMixer', name: 'cement mixer', color: '#3d7fe0' },
  { id: 'fireTruck', name: 'fire truck', color: '#e4473b' },
  { id: 'ambulance', name: 'ambulance', color: '#f4f4f4' },
  { id: 'policeCar', name: 'police car', color: '#2b4fa0' },
  { id: 'towTruck', name: 'tow truck', color: '#3fae5a' },
];
