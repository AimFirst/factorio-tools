import rawData from '../data/generated/factorio-data.json' with { type: 'json' };
import type { FactorioDataBundle, FactorioItem, FactorioFluid } from '../data/generated/types';

export const factorioData = rawData as unknown as FactorioDataBundle;

export function getAllItems(): FactorioItem[] {
  return Object.values(factorioData.items);
}

export function getAllFluids(): FactorioFluid[] {
  return Object.values(factorioData.fluids);
}

export function getItem(id: string): FactorioItem | undefined {
  return factorioData.items[id];
}

export function getFluid(id: string): FactorioFluid | undefined {
  return factorioData.fluids[id];
}

export function getResource(id: string): (FactorioItem | FactorioFluid) | undefined {
  return factorioData.items[id] || factorioData.fluids[id];
}

/**
 * Calculates train capacity based on resource type, number of wagons, and quality.
 * In Factorio Space Age:
 * - Legendary Cargo Wagon has 2.5x base inventory size = 100 slots (vs 40 base).
 * - Legendary item stacks: Items in legendary quality have 2.5x base stack size (+150%).
 * If legendary trains & items are both used, a cargo wagon holds 100 slots * (baseStackSize * 2.5) items.
 * If standard items are carried in legendary wagons, it's 100 slots * baseStackSize.
 * Fluid wagons hold 50,000 units per wagon.
 */
export function calculateTrainCapacity(params: {
  resourceId: string;
  isFluid: boolean;
  wagonCount: number;
  isLegendaryQuality: boolean;
}): {
  totalCapacity: number;
  capacityPerWagon: number;
  slotsPerWagon: number;
  effectiveStackSize: number;
} {
  const { resourceId, isFluid, wagonCount, isLegendaryQuality } = params;

  if (isFluid) {
    const baseWagonFluid = factorioData.rollingStock.fluidWagon.baseCapacity || 50000;
    // Legendary quality increases fluid wagon capacity by 2.5x to 125,000 units
    const capacityPerWagon = isLegendaryQuality ? Math.floor(baseWagonFluid * 2.5) : baseWagonFluid;
    return {
      totalCapacity: wagonCount * capacityPerWagon,
      capacityPerWagon,
      slotsPerWagon: 0,
      effectiveStackSize: 0,
    };
  }

  const item = getItem(resourceId);
  const baseStackSize = item?.stackSize || 50;
  
  // Legendary quality increases item stack size by 2.5x (+150%)
  const effectiveStackSize = isLegendaryQuality
    ? Math.floor(baseStackSize * 2.5)
    : baseStackSize;

  // Legendary cargo wagon holds 100 slots (40 base * 2.5)
  const slotsPerWagon = isLegendaryQuality
    ? factorioData.rollingStock.cargoWagon.legendaryInventorySize
    : factorioData.rollingStock.cargoWagon.baseInventorySize;

  const capacityPerWagon = slotsPerWagon * effectiveStackSize;
  const totalCapacity = wagonCount * capacityPerWagon;

  return {
    totalCapacity,
    capacityPerWagon,
    slotsPerWagon,
    effectiveStackSize,
  };
}

export function formatRate(ratePerSec: number): {
  perSec: string;
  perMin: string;
  perHour: string;
} {
  const perSecStr = ratePerSec < 10 ? ratePerSec.toFixed(2) : Math.round(ratePerSec).toLocaleString();
  const perMin = ratePerSec * 60;
  const perMinStr = perMin < 100 ? perMin.toFixed(1) : Math.round(perMin).toLocaleString();
  const perHour = ratePerSec * 3600;
  const perHourStr = Math.round(perHour).toLocaleString();

  return {
    perSec: `${perSecStr}/s`,
    perMin: `${perMinStr}/m`,
    perHour: `${perHourStr}/h`,
  };
}
