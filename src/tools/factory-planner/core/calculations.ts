/**
 * Calculation helpers for Factorio 2.1 Factory Blocks:
 * - Train capacity & trips/min based on units per second (ratePerSecond)
 * - Rocket silo launches/min (Legendary quality)
 * - Required train bays
 */

import { calculateTrainCapacity, getItem } from '../../../lib/factorio.ts';
import type { BlockResourceFlow } from '../types.ts';

/**
 * Recalculates train capacity and trains per minute for a block flow entry.
 */
export function updateFlowMetrics(flow: {
  id: string;
  isFluid: boolean;
  ratePerSecond?: number;
  ratePerMinute?: number;
  wagonCount: number;
  isLegendary: boolean;
}): {
  ratePerSecond: number;
  trainCapacity: number;
  trainsPerMinute: number;
} {
  const ratePerSecond =
    flow.ratePerSecond !== undefined
      ? flow.ratePerSecond
      : (flow.ratePerMinute ?? 0) / 60;

  const cap = calculateTrainCapacity({
    resourceId: flow.id,
    isFluid: flow.isFluid,
    wagonCount: flow.wagonCount,
    isLegendaryQuality: flow.isLegendary,
  });

  const trainCapacity = Math.max(1, cap.totalCapacity);
  // (ratePerSecond * 60) = ratePerMinute
  const trainsPerMinute = (ratePerSecond * 60) / trainCapacity;

  return {
    ratePerSecond,
    trainCapacity,
    trainsPerMinute,
  };
}

/**
 * Calculates launches per minute for a Legendary Rocket Silo in Factorio 2.1.
 * Standard cargo rocket capacity is 1,000 kg.
 * Factorio 2.1 items have weights; items without an explicit weight default to 1.0 kg.
 */
export function calculateSiloLaunches(params: {
  cargoResourceId: string;
  ratePerSecond?: number;
  ratePerMinute?: number;
}): {
  ratePerSecond: number;
  launchesPerMinute: number;
  weightPerItemKg: number;
  capacityPerRocket: number;
} {
  const ratePerSecond =
    params.ratePerSecond !== undefined
      ? params.ratePerSecond
      : (params.ratePerMinute ?? 0) / 60;

  const item = getItem(params.cargoResourceId);
  // Factorio prototypes store weight in grams (e.g. 1000 = 1.0 kg, 2000 = 2.0 kg)
  const weightGrams = item?.weight ?? 1000;
  const weightPerItemKg = weightGrams / 1000;
  // Rocket holds 1,000 kg (1,000,000 grams) total payload
  const capacityPerRocket = Math.max(1, Math.floor(1000 / weightPerItemKg));
  const ratePerMinute = ratePerSecond * 60;
  const launchesPerMinute = ratePerMinute / capacityPerRocket;

  return {
    ratePerSecond,
    launchesPerMinute,
    weightPerItemKg,
    capacityPerRocket,
  };
}

/**
 * Sustained launch rate of a Legendary Rocket Silo in Factorio 2.1 (approx. 1 launch/min).
 */
export const LEGENDARY_SILO_MAX_LAUNCHES_PER_MIN = 1.0;

/**
 * Calculates rocket logistics for an interplanetary trade route in Factorio 2.1.
 */
export function calculateInterplanetaryRoute(params: {
  cargoResourceId: string;
  ratePerSecond?: number;
  ratePerMinute?: number;
}): {
  ratePerSecond: number;
  weightPerItemKg: number;
  capacityPerRocket: number;
  launchesPerMinute: number;
  silosRequired: number;
} {
  const siloCalc = calculateSiloLaunches(params);

  const silosRequired = Math.max(
    1,
    Math.ceil(
      Number(
        (siloCalc.launchesPerMinute / LEGENDARY_SILO_MAX_LAUNCHES_PER_MIN - 1e-7).toFixed(6)
      )
    )
  );

  return {
    ratePerSecond: siloCalc.ratePerSecond,
    weightPerItemKg: siloCalc.weightPerItemKg,
    capacityPerRocket: siloCalc.capacityPerRocket,
    launchesPerMinute: siloCalc.launchesPerMinute,
    silosRequired,
  };
}

/**
 * Creates a normalized BlockResourceFlow entry with calculations applied.
 */
export function createResourceFlow(params: {
  id: string;
  name: string;
  isFluid: boolean;
  ratePerSecond?: number;
  ratePerMinute?: number;
  wagonCount?: number;
  isLegendary?: boolean;
  allocatedBays?: number;
}): BlockResourceFlow {
  const wagonCount = params.wagonCount ?? 2;
  const isLegendary = params.isLegendary ?? false;
  const metrics = updateFlowMetrics({
    id: params.id,
    isFluid: params.isFluid,
    ratePerSecond: params.ratePerSecond,
    ratePerMinute: params.ratePerMinute,
    wagonCount,
    isLegendary,
  });

  return {
    id: params.id,
    name: params.name,
    isFluid: params.isFluid,
    ratePerSecond: metrics.ratePerSecond,
    wagonCount,
    isLegendary,
    trainCapacity: metrics.trainCapacity,
    trainsPerMinute: metrics.trainsPerMinute,
    allocatedBays: params.allocatedBays ?? 1,
  };
}
