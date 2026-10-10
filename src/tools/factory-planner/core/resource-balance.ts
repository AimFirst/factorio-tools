/**
 * Planetary Resource Balance & Shortfall Engine
 * Analyzes aggregate supply and demand across all factory blocks (accounting for blueprintMultiplier),
 * raw resource ingress outposts, and space hubs to identify deficits and shortfalls.
 */

import type { HexBlock, RawIngressNode, SpaceHubNode } from '../types.ts';
import { getItem, getFluid } from '../../../lib/factorio.ts';

export interface ResourceParticipant {
  blockId: string;
  blockName: string;
  ratePerSecond: number; // Scaled by blueprintMultiplier
  baseRatePerSecond: number; // Base rate of single block instance
  multiplier: number;
}

export interface ResourceBalanceItem {
  resourceId: string;
  resourceName: string;
  isFluid: boolean;
  totalSupply: number; // Scaled total production rate/sec
  totalDemand: number; // Scaled total consumption rate/sec
  netBalance: number; // totalSupply - totalDemand
  status: 'surplus' | 'balanced' | 'deficit';
  deficitRate: number; // Shortfall amount if in deficit, else 0
  satisfactionPercent: number; // (totalSupply / totalDemand) * 100, clamped to 100%
  producers: ResourceParticipant[];
  consumers: ResourceParticipant[];
  estimatedAdditionalMultiplier?: number;
}

export interface PlanetaryResourceBalanceReport {
  items: ResourceBalanceItem[];
  deficits: ResourceBalanceItem[];
  surpluses: ResourceBalanceItem[];
  balanced: ResourceBalanceItem[];
  hasDeficits: boolean;
  totalDeficitCount: number;
  deficitMap: Map<string, ResourceBalanceItem>;
}

export function calculatePlanetaryResourceBalance(params: {
  blocks: HexBlock[];
  rawIngressNodes?: RawIngressNode[];
  spaceHubs?: SpaceHubNode[];
}): PlanetaryResourceBalanceReport {
  const { blocks, rawIngressNodes = [], spaceHubs = [] } = params;

  interface ResAccumulator {
    id: string;
    name: string;
    isFluid: boolean;
    totalSupply: number;
    totalDemand: number;
    producers: ResourceParticipant[];
    consumers: ResourceParticipant[];
  }

  const map = new Map<string, ResAccumulator>();

  const getOrCreate = (id: string, fallbackName?: string, isFluidFallback?: boolean): ResAccumulator => {
    let entry = map.get(id);
    if (!entry) {
      const item = getItem(id);
      const fluid = getFluid(id);
      const name = fallbackName || item?.name || fluid?.name || id;
      const isFluid = isFluidFallback !== undefined ? isFluidFallback : !!fluid;
      entry = {
        id,
        name,
        isFluid,
        totalSupply: 0,
        totalDemand: 0,
        producers: [],
        consumers: [],
      };
      map.set(id, entry);
    }
    return entry;
  };

  // 1. Accumulate Raw Mining Outposts (Supply)
  for (const raw of rawIngressNodes) {
    const rate = raw.ratePerSecond ?? (raw.ratePerMinute ? raw.ratePerMinute / 60 : 0);
    if (rate <= 0) continue;
    const isFluid = !!getFluid(raw.resourceId);
    const entry = getOrCreate(raw.resourceId, raw.name, isFluid);
    entry.totalSupply += rate;
    entry.producers.push({
      blockId: raw.id,
      blockName: `${raw.name} (Outpost)`,
      ratePerSecond: rate,
      baseRatePerSecond: rate,
      multiplier: 1,
    });
  }

  // 2. Accumulate Space Hubs (Orbital Cargo Landing Pads supply, Silos consume)
  for (const hub of spaceHubs) {
    // Avoid double counting if hub is also modeled as a HexBlock
    if (blocks.some((b) => b.id === hub.id)) continue;
    const rate = hub.ratePerSecond ?? (hub.ratePerMinute ? hub.ratePerMinute / 60 : 0);
    if (rate <= 0) continue;
    const isFluid = !!getFluid(hub.cargoResourceId);
    const entry = getOrCreate(hub.cargoResourceId, undefined, isFluid);

    if (hub.type === 'cargo-landing-pad') {
      entry.totalSupply += rate;
      entry.producers.push({
        blockId: hub.id,
        blockName: `${hub.name} (Orbital Pad)`,
        ratePerSecond: rate,
        baseRatePerSecond: rate,
        multiplier: 1,
      });
    } else if (hub.type === 'rocket-silo') {
      entry.totalDemand += rate;
      entry.consumers.push({
        blockId: hub.id,
        blockName: `${hub.name} (Export Silo)`,
        ratePerSecond: rate,
        baseRatePerSecond: rate,
        multiplier: 1,
      });
    }
  }

  // 3. Accumulate Factory Blocks (Outputs = Supply, Inputs = Demand)
  // CRITICAL: Account for block.blueprintMultiplier on each block!
  for (const block of blocks) {
    const multiplier = Math.max(1, block.blueprintMultiplier || 1);

    // Outputs (Production)
    for (const out of block.outputs) {
      const baseRate = out.ratePerSecond ?? (out.ratePerMinute ? out.ratePerMinute / 60 : 0);
      const totalRate = baseRate * multiplier;
      const entry = getOrCreate(out.id, out.name, out.isFluid);
      entry.totalSupply += totalRate;
      entry.producers.push({
        blockId: block.id,
        blockName: block.name,
        ratePerSecond: totalRate,
        baseRatePerSecond: baseRate,
        multiplier,
      });
    }

    // Inputs (Consumption)
    for (const inp of block.inputs) {
      const baseRate = inp.ratePerSecond ?? (inp.ratePerMinute ? inp.ratePerMinute / 60 : 0);
      const totalRate = baseRate * multiplier;
      const entry = getOrCreate(inp.id, inp.name, inp.isFluid);
      entry.totalDemand += totalRate;
      entry.consumers.push({
        blockId: block.id,
        blockName: block.name,
        ratePerSecond: totalRate,
        baseRatePerSecond: baseRate,
        multiplier,
      });
    }
  }

  // 4. Build output report
  const items: ResourceBalanceItem[] = [];
  const deficits: ResourceBalanceItem[] = [];
  const surpluses: ResourceBalanceItem[] = [];
  const balanced: ResourceBalanceItem[] = [];
  const deficitMap = new Map<string, ResourceBalanceItem>();

  for (const acc of map.values()) {
    const supply = Number(acc.totalSupply.toFixed(2));
    const demand = Number(acc.totalDemand.toFixed(2));
    const net = Number((supply - demand).toFixed(2));

    const status: 'surplus' | 'balanced' | 'deficit' =
      net < -0.01 ? 'deficit' : net > 0.01 ? 'surplus' : 'balanced';

    const deficitRate = status === 'deficit' ? Number((demand - supply).toFixed(2)) : 0;
    const satisfactionPercent =
      demand <= 0 ? 100 : Number(Math.min(100, (supply / demand) * 100).toFixed(1));

    // Estimate additional multiplier / blocks needed to satisfy deficit
    let estimatedAdditionalMultiplier: number | undefined;
    if (status === 'deficit') {
      const primaryProducer = acc.producers.find((p) => p.baseRatePerSecond > 0);
      if (primaryProducer && primaryProducer.baseRatePerSecond > 0) {
        estimatedAdditionalMultiplier = Math.ceil(deficitRate / primaryProducer.baseRatePerSecond);
      }
    }

    const item: ResourceBalanceItem = {
      resourceId: acc.id,
      resourceName: acc.name,
      isFluid: acc.isFluid,
      totalSupply: supply,
      totalDemand: demand,
      netBalance: net,
      status,
      deficitRate,
      satisfactionPercent,
      producers: acc.producers,
      consumers: acc.consumers,
      estimatedAdditionalMultiplier,
    };

    items.push(item);
    if (status === 'deficit') {
      deficits.push(item);
      deficitMap.set(item.resourceId, item);
    } else if (status === 'surplus') {
      surpluses.push(item);
    } else {
      balanced.push(item);
    }
  }

  // Sort deficits by largest deficit rate first
  deficits.sort((a, b) => b.deficitRate - a.deficitRate);
  surpluses.sort((a, b) => b.netBalance - a.netBalance);
  items.sort((a, b) => {
    if (a.status === 'deficit' && b.status !== 'deficit') return -1;
    if (b.status === 'deficit' && a.status !== 'deficit') return 1;
    return a.resourceName.localeCompare(b.resourceName);
  });

  return {
    items,
    deficits,
    surpluses,
    balanced,
    hasDeficits: deficits.length > 0,
    totalDeficitCount: deficits.length,
    deficitMap,
  };
}
