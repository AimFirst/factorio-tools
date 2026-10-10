/**
 * Traffic Flow Reconciliation Engine
 * Calculates material flows, train trips/min, and transit distance costs
 * between producing blocks/outposts and consuming blocks/hubs.
 */

import type {
  HexBlock,
  HexCoordinates,
  RawIngressNode,
  SpaceHubNode,
} from '../types.ts';
import { hexDistance } from './hex-math.ts';
import { calculateTrainCapacity, getItem, getFluid } from '../../../lib/factorio.ts';

export interface TrafficRoute {
  id: string;
  resourceId: string;
  resourceName: string;
  isFluid: boolean;
  sourceId: string;
  sourceName: string;
  sourceCoords: HexCoordinates | null;
  targetId: string;
  targetName: string;
  targetCoords: HexCoordinates | null;
  ratePerSecond: number;
  ratePerMinute?: number;
  trainsPerMinute: number;
  hexDistance: number;
  transitCost: number; // trainsPerMinute * hexDistance
}

export interface PlanetTrafficReport {
  routes: TrafficRoute[];
  totalRoutes: number;
  totalTrainTripsPerMin: number;
  totalTransitCost: number; // sum of (trainsPerMinute * hexDistance) for placed routes
  congestedRoutes: TrafficRoute[];
}

/**
 * Reconciles material flows and generates all active traffic routes for a planet.
 */
export function calculatePlanetTraffic(params: {
  blocks: HexBlock[];
  rawIngressNodes: RawIngressNode[];
  spaceHubs: SpaceHubNode[];
}): PlanetTrafficReport {
  const { blocks, rawIngressNodes, spaceHubs } = params;
  const routes: TrafficRoute[] = [];

  // Group all producers by resourceId
  interface SupplySource {
    id: string;
    name: string;
    coords: HexCoordinates | null;
    ratePerSecond: number;
    wagonCount: number;
    isLegendary: boolean;
    isFluid: boolean;
  }

  interface DemandSink {
    id: string;
    name: string;
    coords: HexCoordinates | null;
    ratePerSecond: number;
    wagonCount: number;
    isLegendary: boolean;
    isFluid: boolean;
  }

  const suppliersByResource = new Map<string, SupplySource[]>();
  const consumersByResource = new Map<string, DemandSink[]>();

  // 1. Raw Ingress Outposts as suppliers
  for (const raw of rawIngressNodes) {
    const list = suppliersByResource.get(raw.resourceId) || [];
    const isFluid = !!getFluid(raw.resourceId);
    const ratePerSecond = raw.ratePerSecond ?? (raw.ratePerMinute ? raw.ratePerMinute / 60 : 0);
    list.push({
      id: raw.id,
      name: raw.name,
      coords: raw.coordinates,
      ratePerSecond,
      wagonCount: 2,
      isLegendary: false,
      isFluid,
    });
    suppliersByResource.set(raw.resourceId, list);
  }

  // 2. Space Hubs (Landing pads import from orbit as suppliers)
  for (const hub of spaceHubs) {
    const ratePerSecond = hub.ratePerSecond ?? (hub.ratePerMinute ? hub.ratePerMinute / 60 : 0);
    if (hub.type === 'cargo-landing-pad') {
      const list = suppliersByResource.get(hub.cargoResourceId) || [];
      const isFluid = !!getFluid(hub.cargoResourceId);
      list.push({
        id: hub.id,
        name: hub.name,
        coords: hub.coordinates,
        ratePerSecond,
        wagonCount: 2,
        isLegendary: false,
        isFluid,
      });
      suppliersByResource.set(hub.cargoResourceId, list);
    } else if (hub.type === 'rocket-silo') {
      // Rocket silos consume goods for export to orbit
      const list = consumersByResource.get(hub.cargoResourceId) || [];
      const isFluid = !!getFluid(hub.cargoResourceId);
      list.push({
        id: hub.id,
        name: hub.name,
        coords: hub.coordinates,
        ratePerSecond,
        wagonCount: 2,
        isLegendary: false,
        isFluid,
      });
      consumersByResource.set(hub.cargoResourceId, list);
    }
  }

  // 3. Factory Blocks outputs and inputs
  for (const b of blocks) {
    for (const out of b.outputs) {
      const list = suppliersByResource.get(out.id) || [];
      const ratePerSecond = out.ratePerSecond ?? (out.ratePerMinute ? out.ratePerMinute / 60 : 0);
      list.push({
        id: b.id,
        name: b.name,
        coords: b.coordinates,
        ratePerSecond,
        wagonCount: out.wagonCount,
        isLegendary: out.isLegendary,
        isFluid: out.isFluid,
      });
      suppliersByResource.set(out.id, list);
    }

    for (const inp of b.inputs) {
      const list = consumersByResource.get(inp.id) || [];
      const ratePerSecond = inp.ratePerSecond ?? (inp.ratePerMinute ? inp.ratePerMinute / 60 : 0);
      list.push({
        id: b.id,
        name: b.name,
        coords: b.coordinates,
        ratePerSecond,
        wagonCount: inp.wagonCount,
        isLegendary: inp.isLegendary,
        isFluid: inp.isFluid,
      });
      consumersByResource.set(inp.id, list);
    }
  }

  // Reconcile flow for each resource
  const allResourceIds = new Set([
    ...suppliersByResource.keys(),
    ...consumersByResource.keys(),
  ]);

  for (const resourceId of allResourceIds) {
    const suppliers = suppliersByResource.get(resourceId) || [];
    const consumers = consumersByResource.get(resourceId) || [];

    if (suppliers.length === 0 || consumers.length === 0) {
      continue;
    }

    const totalSupplied = suppliers.reduce((s, x) => s + x.ratePerSecond, 0);

    const isFluid = suppliers[0]?.isFluid ?? consumers[0]?.isFluid ?? false;
    const itemData = getItem(resourceId);
    const fluidData = getFluid(resourceId);
    const resourceName = itemData?.name || fluidData?.name || resourceId;

    // Train capacity per wagon
    const cap = calculateTrainCapacity({
      resourceId,
      isFluid,
      wagonCount: 2,
      isLegendaryQuality: false,
    });
    const trainCap = Math.max(1, cap.totalCapacity);

    // Proportional matching between suppliers and consumers
    for (const sup of suppliers) {
      for (const con of consumers) {
        if (sup.id === con.id) continue; // Skip self

        // Flow amount in units per second
        const proportion = sup.ratePerSecond / Math.max(0.0001, totalSupplied);
        const flowRatePerSec = Math.min(sup.ratePerSecond, con.ratePerSecond * proportion);

        if (flowRatePerSec <= 0) continue;

        // trainsPerMinute = (unitsPerSecond * 60) / trainCapacity
        const trainsPerMin = (flowRatePerSec * 60) / trainCap;

        let dist = 1;
        let transitCost = 0;

        if (sup.coords && con.coords) {
          dist = hexDistance(sup.coords, con.coords);
          transitCost = trainsPerMin * dist;
        }

        routes.push({
          id: `route-${sup.id}-${con.id}-${resourceId}`,
          resourceId,
          resourceName,
          isFluid,
          sourceId: sup.id,
          sourceName: sup.name,
          sourceCoords: sup.coords,
          targetId: con.id,
          targetName: con.name,
          targetCoords: con.coords,
          ratePerSecond: flowRatePerSec,
          ratePerMinute: flowRatePerSec * 60,
          trainsPerMinute: trainsPerMin,
          hexDistance: dist,
          transitCost,
        });
      }
    }
  }

  const totalTrainTripsPerMin = routes.reduce((sum, r) => sum + r.trainsPerMinute, 0);
  const totalTransitCost = routes.reduce((sum, r) => sum + r.transitCost, 0);

  // Top congested routes by transit cost
  const congestedRoutes = [...routes]
    .sort((a, b) => b.transitCost - a.transitCost)
    .slice(0, 5);

  return {
    routes,
    totalRoutes: routes.length,
    totalTrainTripsPerMin,
    totalTransitCost,
    congestedRoutes,
  };
}
