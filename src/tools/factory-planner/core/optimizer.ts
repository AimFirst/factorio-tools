/**
 * Hexagonal Grid Layout Optimizer (Simulated Annealing)
 * Optimizes the placement of factory blocks on the hex grid to minimize
 * total train transit distance: sum(trainsPerMinute * hexDistance).
 */

import type {
  HexBlock,
  HexCoordinates,
  RawIngressNode,
  SpaceHubNode,
} from '../types.ts';
import {
  hexDistance,
  hexKey,
  getHexNeighbors,
  generateHexGridRadius,
} from './hex-math.ts';
import { calculatePlanetTraffic } from './traffic-engine.ts';

export interface OptimizationResult {
  optimizedPlacements: Map<string, HexCoordinates>;
  initialTransitCost: number;
  optimizedTransitCost: number;
  improvementPercent: number;
  iterations: number;
}

export interface OptimizationOptions {
  iterations?: number;
  temperature?: number;
  coolingRate?: number;
  clusterCenter?: HexCoordinates;
}

/**
 * Computes the total transit cost given a specific placement mapping for blocks.
 */
function evaluatePlacements(
  blocks: HexBlock[],
  placements: Map<string, HexCoordinates>,
  rawIngressNodes: RawIngressNode[],
  spaceHubs: SpaceHubNode[]
): number {
  const placedBlocks = blocks.map((b) => ({
    ...b,
    coordinates: placements.get(b.id) || null,
  }));

  const report = calculatePlanetTraffic({
    blocks: placedBlocks,
    rawIngressNodes,
    spaceHubs,
  });

  // Base transit cost
  let cost = report.totalTransitCost;

  // Add a mild compactness penalty: distance from centroid
  for (const coords of placements.values()) {
    cost += hexDistance(coords, { q: 0, r: 0 }) * 0.05;
  }

  return cost;
}

/**
 * Runs Simulated Annealing to optimize block coordinates on the hex grid.
 */
export function optimizeBlockLayout(params: {
  blocks: HexBlock[];
  rawIngressNodes: RawIngressNode[];
  spaceHubs: SpaceHubNode[];
  options?: OptimizationOptions;
}): OptimizationResult {
  const { blocks, rawIngressNodes, spaceHubs, options } = params;

  if (blocks.length <= 1) {
    const singlePlacements = new Map<string, HexCoordinates>();
    if (blocks[0]) {
      singlePlacements.set(blocks[0].id, blocks[0].coordinates || { q: 0, r: 0 });
    }
    return {
      optimizedPlacements: singlePlacements,
      initialTransitCost: 0,
      optimizedTransitCost: 0,
      improvementPercent: 0,
      iterations: 0,
    };
  }

  const maxIterations = options?.iterations ?? 4000;
  let temp = options?.temperature ?? 50.0;
  const coolingRate = options?.coolingRate ?? 0.998;

  // Set of occupied coordinates by outposts and space hubs that cannot be overlapped
  const fixedOccupiedKeys = new Set<string>();
  for (const raw of rawIngressNodes) {
    if (raw.coordinates) fixedOccupiedKeys.add(hexKey(raw.coordinates));
  }
  for (const hub of spaceHubs) {
    if (hub.coordinates) fixedOccupiedKeys.add(hexKey(hub.coordinates));
  }

  // Initial Placements
  const currentPlacements = new Map<string, HexCoordinates>();
  const occupiedKeys = new Set<string>(fixedOccupiedKeys);

  // Available candidate hexes in spiral from center
  const candidateHexes = generateHexGridRadius(Math.max(3, Math.ceil(Math.sqrt(blocks.length)) + 1));
  let candidateIndex = 0;

  for (const block of blocks) {
    if (block.coordinates && !occupiedKeys.has(hexKey(block.coordinates))) {
      currentPlacements.set(block.id, block.coordinates);
      occupiedKeys.add(hexKey(block.coordinates));
    } else {
      // Find next free hex
      while (candidateIndex < candidateHexes.length) {
        const cand = candidateHexes[candidateIndex++];
        const k = hexKey(cand);
        if (!occupiedKeys.has(k)) {
          currentPlacements.set(block.id, cand);
          occupiedKeys.add(k);
          break;
        }
      }
    }
  }

  let bestPlacements = new Map<string, HexCoordinates>(currentPlacements);
  let initialCost = evaluatePlacements(blocks, currentPlacements, rawIngressNodes, spaceHubs);
  let currentCost = initialCost;
  let bestCost = initialCost;

  const blockIds = blocks.map((b) => b.id);

  // Annealing Loop
  for (let iter = 0; iter < maxIterations; iter++) {
    // Pick a random block
    const b1Index = Math.floor(Math.random() * blockIds.length);
    const b1Id = blockIds[b1Index];
    const b1Coords = currentPlacements.get(b1Id)!;

    // 50% chance to swap with another block, 50% chance to move to adjacent vacant neighbor
    const doSwap = Math.random() < 0.5 && blockIds.length > 1;

    let candidateMove: {
      b1NewCoords: HexCoordinates;
      b2Id?: string;
      b2NewCoords?: HexCoordinates;
    } | null = null;

    if (doSwap) {
      let b2Index = Math.floor(Math.random() * blockIds.length);
      while (b2Index === b1Index) {
        b2Index = Math.floor(Math.random() * blockIds.length);
      }
      const b2Id = blockIds[b2Index];
      const b2Coords = currentPlacements.get(b2Id)!;

      candidateMove = {
        b1NewCoords: b2Coords,
        b2Id,
        b2NewCoords: b1Coords,
      };
    } else {
      // Move b1 to an adjacent neighbor
      const neighbors = getHexNeighbors(b1Coords);
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      const k = hexKey(randomNeighbor);

      // Check if unoccupied
      if (!fixedOccupiedKeys.has(k)) {
        // Is it occupied by another block?
        const occupyingBlockId = [...currentPlacements.entries()].find(
          ([_, c]) => c.q === randomNeighbor.q && c.r === randomNeighbor.r
        )?.[0];

        if (occupyingBlockId) {
          // Swap with occupying block
          candidateMove = {
            b1NewCoords: randomNeighbor,
            b2Id: occupyingBlockId,
            b2NewCoords: b1Coords,
          };
        } else {
          // Move to empty neighbor
          candidateMove = {
            b1NewCoords: randomNeighbor,
          };
        }
      }
    }

    if (!candidateMove) continue;

    // Apply speculative move
    const prevB1Coords = currentPlacements.get(b1Id)!;
    currentPlacements.set(b1Id, candidateMove.b1NewCoords);
    let prevB2Coords: HexCoordinates | undefined;
    if (candidateMove.b2Id && candidateMove.b2NewCoords) {
      prevB2Coords = currentPlacements.get(candidateMove.b2Id)!;
      currentPlacements.set(candidateMove.b2Id, candidateMove.b2NewCoords);
    }

    const newCost = evaluatePlacements(blocks, currentPlacements, rawIngressNodes, spaceHubs);
    const delta = newCost - currentCost;

    if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
      // Accept move
      currentCost = newCost;
      if (currentCost < bestCost) {
        bestCost = currentCost;
        bestPlacements = new Map<string, HexCoordinates>(currentPlacements);
      }
    } else {
      // Revert move
      currentPlacements.set(b1Id, prevB1Coords);
      if (candidateMove.b2Id && prevB2Coords) {
        currentPlacements.set(candidateMove.b2Id, prevB2Coords);
      }
    }

    temp *= coolingRate;
  }

  const improvementPercent =
    initialCost > 0
      ? Math.max(0, ((initialCost - bestCost) / initialCost) * 100)
      : 0;

  return {
    optimizedPlacements: bestPlacements,
    initialTransitCost: initialCost,
    optimizedTransitCost: bestCost,
    improvementPercent,
    iterations: maxIterations,
  };
}
