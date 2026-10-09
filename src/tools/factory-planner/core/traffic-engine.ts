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
  ratePerMinute: number;
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
    ratePerMinute: number;
    wagonCount: number;
    isLegendary: boolean;
    isFluid: boolean;
  }

  interface DemandSink {
    id: string;
    name: string;
    coords: HexCoordinates | null;
    ratePerMinute: number;
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
    list.push({
      id: raw.id,
      name: raw.name,
      coords: raw.coordinates,
      ratePerMinute: raw.ratePerMinute,
      wagonCount: 2,
      isLegendary: false,
      isFluid,
    });
    suppliersByResource.set(raw.resourceId, list);
  }

  // 2. Space Hubs (Landing pads import from orbit as suppliers)
  for (const hub of spaceHubs) {
    if (hub.type === 'cargo-landing-pad') {
      const list = suppliersByResource.get(hub.cargoResourceId) || [];
      const isFluid = !!getFluid(hub.cargoResourceId);
      list.push({
        id: hub.id,
        name: hub.name,
        coords: hub.coordinates,
        ratePerMinute: hub.ratePerMinute,
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
        ratePerMinute: hub.ratePerMinute,
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
      list.push({
        id: b.id,
        name: b.name,
        coords: b.coordinates,
        ratePerMinute: out.ratePerMinute,
        wagonCount: out.wagonCount,
        isLegendary: out.isLegendary,
        isFluid: out.isFluid,
      });
      suppliersByResource.set(out.id, list);
    }

    for (const inp of b.inputs) {
      const list = consumersByResource.get(inp.id) || [];
      list.push({
        id: b.id,
        name: b.name,
        coords: b.coordinates,
        ratePerMinute: inp.ratePerMinute,
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

    const totalSupplied = suppliers.reduce((s, x) => s + x.ratePerMinute, 0);

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

        // Flow amount
        const proportion = sup.ratePerMinute / Math.max(1, totalSupplied);
        const flowRate = Math.min(sup.ratePerMinute, con.ratePerMinute * proportion);

        if (flowRate <= 0) continue;

        const trainsPerMin = flowRate / trainCap;

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
          ratePerMinute: flowRate,
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
