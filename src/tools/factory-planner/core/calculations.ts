/**
 * Calculation helpers for Factorio 2.1 Factory Blocks:
 * - Train capacity & trips/min
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
  ratePerMinute: number;
  wagonCount: number;
  isLegendary: boolean;
}): {
  trainCapacity: number;
  trainsPerMinute: number;
} {
  const cap = calculateTrainCapacity({
    resourceId: flow.id,
    isFluid: flow.isFluid,
    wagonCount: flow.wagonCount,
    isLegendaryQuality: flow.isLegendary,
  });

  const trainCapacity = Math.max(1, cap.totalCapacity);
  const trainsPerMinute = flow.ratePerMinute / trainCapacity;

  return {
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
  ratePerMinute: number;
}): {
  launchesPerMinute: number;
  weightPerItemKg: number;
  capacityPerRocket: number;
} {
  const item = getItem(params.cargoResourceId);
  // Factorio prototypes store weight in grams (e.g. 1000 = 1.0 kg, 2000 = 2.0 kg)
  const weightGrams = item?.weight ?? 1000;
  const weightPerItemKg = weightGrams / 1000;
  // Rocket holds 1,000 kg (1,000,000 grams) total payload
  const capacityPerRocket = Math.max(1, Math.floor(1000 / weightPerItemKg));
  const launchesPerMinute = params.ratePerMinute / capacityPerRocket;

  return {
    launchesPerMinute,
    weightPerItemKg,
    capacityPerRocket,
  };
}

/**
 * Creates a normalized BlockResourceFlow entry with calculations applied.
 */
export function createResourceFlow(params: {
  id: string;
  name: string;
  isFluid: boolean;
  ratePerMinute: number;
  wagonCount?: number;
  isLegendary?: boolean;
  allocatedBays?: number;
}): BlockResourceFlow {
  const wagonCount = params.wagonCount ?? 2;
  const isLegendary = params.isLegendary ?? false;
  const metrics = updateFlowMetrics({
    id: params.id,
    isFluid: params.isFluid,
    ratePerMinute: params.ratePerMinute,
    wagonCount,
    isLegendary,
  });

  return {
    id: params.id,
    name: params.name,
    isFluid: params.isFluid,
    ratePerMinute: params.ratePerMinute,
    wagonCount,
    isLegendary,
    trainCapacity: metrics.trainCapacity,
    trainsPerMinute: metrics.trainsPerMinute,
    allocatedBays: params.allocatedBays ?? 1,
  };
}
