export interface StationDemandInput {
  id: string;
  name: string;
  isFluid: boolean;
  ratePerSec: number;
  trainCapacity: number;
  minStations?: number;
  lockStations?: number | null;
  stackSize?: number;
}

export type AllocationMode = 'train-throughput' | 'raw-rate';

export type CongestionLevel = 'critical' | 'heavy' | 'optimal' | 'light';

export interface AllocatedResourceResult {
  id: string;
  name: string;
  isFluid: boolean;
  ratePerSec: number;
  trainCapacity: number;
  allocatedStations: number;
  isLocked: boolean;
  trainsPerHourTotal: number;
  trainsPerHourPerStation: number;
  secondsBetweenTrains: number;
  ratePerStation: number;
  congestion: CongestionLevel;
  proportionalShare: number; // Percentage of total demand
}

export interface ApportionmentResult {
  totalStations: number;
  usedStations: number;
  availableStations: number;
  allocations: AllocatedResourceResult[];
  warnings: string[];
  isOverCapacity: boolean;
}

export function allocateStations(
  inputs: StationDemandInput[],
  totalStations: number = 8,
  mode: AllocationMode = 'train-throughput'
): ApportionmentResult {
  const warnings: string[] = [];
  const validInputs = inputs.filter(r => r.ratePerSec > 0 || (r.lockStations && r.lockStations > 0));

  if (validInputs.length === 0) {
    return {
      totalStations,
      usedStations: 0,
      availableStations: totalStations,
      allocations: [],
      warnings: ['No resource demands entered.'],
      isOverCapacity: false,
    };
  }

  // Check if unique resources exceed available station bays
  if (validInputs.length > totalStations) {
    warnings.push(
      `Cannot allocate 1 station per resource: ${validInputs.length} unique resources requested for a ${totalStations}-station city block. Consider splitting resources across multiple city blocks.`
    );
  }

  // Separate locked and unlocked resources
  const lockedAllocations: Map<string, number> = new Map();
  let lockedSlotsCount = 0;

  for (const item of validInputs) {
    if (typeof item.lockStations === 'number' && item.lockStations > 0) {
      lockedAllocations.set(item.id, item.lockStations);
      lockedSlotsCount += item.lockStations;
    }
  }

  const unlockedInputs = validInputs.filter(item => !lockedAllocations.has(item.id));
  const defaultMinStations = 1;

  // Each unlocked resource needs at least minStations (default 1)
  const unlockedMinSlots = unlockedInputs.reduce(
    (sum, item) => sum + (item.minStations ?? defaultMinStations),
    0
  );

  const baseCommittedSlots = lockedSlotsCount + unlockedMinSlots;

  if (baseCommittedSlots > totalStations) {
    warnings.push(
      `Required minimum station allocations (${baseCommittedSlots}) exceed total available stations (${totalStations}).`
    );
  }

  const availableForUnlocked = Math.max(0, totalStations - lockedSlotsCount);

  // Calculate demand weights for unlocked resources
  const weights: Map<string, number> = new Map();
  let totalWeight = 0;

  for (const item of unlockedInputs) {
    let weight = 0;
    if (mode === 'train-throughput') {
      const trainDemandPerSec = item.trainCapacity > 0 ? item.ratePerSec / item.trainCapacity : 0;
      weight = trainDemandPerSec;
    } else {
      weight = item.ratePerSec;
    }
    weights.set(item.id, weight);
    totalWeight += weight;
  }

  // Each unlocked resource starts with its minStations (default 1)
  const preliminaryStations: Map<string, number> = new Map();
  const ideals: Map<string, number> = new Map();

  for (const item of unlockedInputs) {
    const minS = item.minStations ?? defaultMinStations;
    preliminaryStations.set(item.id, minS);

    const w = weights.get(item.id) || 0;
    const share = totalWeight > 0 ? w / totalWeight : 1 / unlockedInputs.length;
    const idealQuota = share * availableForUnlocked;
    ideals.set(item.id, idealQuota);
  }

  const baseCommittedUnlocked = unlockedInputs.reduce(
    (sum, item) => sum + (preliminaryStations.get(item.id) || 1),
    0
  );
  let leftovers = availableForUnlocked - baseCommittedUnlocked;

  // Distribute leftover slots iteratively to the resource with the greatest deficit (ideal - allocated)
  while (leftovers > 0) {
    let bestId: string | null = null;
    let maxDeficit = -Infinity;

    for (const item of unlockedInputs) {
      const ideal = ideals.get(item.id) || 0;
      const current = preliminaryStations.get(item.id) || 0;
      const deficit = ideal - current;

      if (deficit > maxDeficit) {
        maxDeficit = deficit;
        bestId = item.id;
      }
    }

    if (bestId && maxDeficit > -Infinity) {
      preliminaryStations.set(bestId, (preliminaryStations.get(bestId) || 0) + 1);
      leftovers -= 1;
    } else {
      break;
    }
  }

  // Assemble final results and calculate per-station logistics metrics
  const allocations: AllocatedResourceResult[] = [];
  let totalUsed = 0;

  for (const item of validInputs) {
    const isLocked = lockedAllocations.has(item.id);
    const count = isLocked
      ? (lockedAllocations.get(item.id) || 1)
      : (preliminaryStations.get(item.id) || 1);

    totalUsed += count;

    const trainsPerHourTotal = item.trainCapacity > 0 ? (item.ratePerSec / item.trainCapacity) * 3600 : 0;
    const trainsPerHourPerStation = count > 0 ? trainsPerHourTotal / count : 0;
    const secondsBetweenTrains = trainsPerHourPerStation > 0 ? 3600 / trainsPerHourPerStation : Infinity;
    const ratePerStation = count > 0 ? item.ratePerSec / count : 0;

    let congestion: CongestionLevel = 'optimal';
    if (secondsBetweenTrains < 25) {
      congestion = 'critical';
      warnings.push(`Warning: ${item.name} requires a train every ${Math.round(secondsBetweenTrains)}s per station. Intersection bottlenecks are likely.`);
    } else if (secondsBetweenTrains < 50) {
      congestion = 'heavy';
    } else if (secondsBetweenTrains > 300) {
      congestion = 'light';
    }

    const weight = weights.get(item.id) || 0;
    const share = totalWeight > 0 ? (weight / totalWeight) * 100 : (100 / validInputs.length);

    allocations.push({
      id: item.id,
      name: item.name,
      isFluid: item.isFluid,
      ratePerSec: item.ratePerSec,
      trainCapacity: item.trainCapacity,
      allocatedStations: count,
      isLocked,
      trainsPerHourTotal,
      trainsPerHourPerStation,
      secondsBetweenTrains,
      ratePerStation,
      congestion,
      proportionalShare: isLocked ? 0 : share,
    });
  }

  return {
    totalStations,
    usedStations: totalUsed,
    availableStations: Math.max(0, totalStations - totalUsed),
    allocations,
    warnings,
    isOverCapacity: totalUsed > totalStations || validInputs.length > totalStations,
  };
}
