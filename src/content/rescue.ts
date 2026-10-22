import type { VehicleId } from './vehicles';

/** Rescue Station: who to send for each emergency, and how each vehicle sounds. */
export type RescueId = 'fireTruck' | 'ambulance' | 'policeCar' | 'towTruck';
export const RESCUE_VEHICLES: readonly RescueId[] = ['fireTruck', 'ambulance', 'policeCar', 'towTruck'];

export type EmergencyId = 'fire' | 'hurt' | 'traffic' | 'brokenCar';

export interface Emergency {
  id: EmergencyId;
  /** The vehicle that helps. */
  vehicle: RescueId;
  /** Spoken as one sentence: "There's a fire! Which truck do we need?" */
  sentence: string;
}

export const EMERGENCIES: readonly Emergency[] = [
  { id: 'fire', vehicle: 'fireTruck', sentence: "There's a fire! Which truck do we need?" },
  { id: 'hurt', vehicle: 'ambulance', sentence: 'Someone got hurt! Who can help?' },
  { id: 'traffic', vehicle: 'policeCar', sentence: "The cars are stuck! Who can help?" },
  { id: 'brokenCar', vehicle: 'towTruck', sentence: 'A car broke down! Who can help?' },
];

export function emergencyFor(vehicle: RescueId): Emergency {
  return EMERGENCIES.find((e) => e.vehicle === vehicle)!;
}

/** Every rescue vehicle is also one of the eight in his garage. */
export const asVehicle = (id: RescueId): VehicleId => id;
