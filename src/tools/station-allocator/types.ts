import type { BeltType } from '../../types';

export type RateUnit = 'per-sec' | 'per-min' | 'belts';

export interface ResourceDemandEntry {
  id: string;
  name: string;
  isFluid: boolean;
  inputRate: number; // Consumption per single blueprint copy
  unit: RateUnit;
  beltType: BeltType;
  lockStations: number | null; // Optional manual lock
}

export interface CityBlockConfig {
  name: string;
  blueprintMultiplier: number;
  totalStations: number;
  trainWagons: number;
  isLegendaryQuality: boolean;
  allocationMode: 'train-throughput' | 'raw-rate';
  entries: ResourceDemandEntry[];
}
