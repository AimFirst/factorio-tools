/**
 * Factorio 2.1 Starter Multi-World Megabase Project:
 * Generates an initial project with Nauvis starter blocks, outposts, and space platform.
 */

import type { FactoryPlannerProject, SolidPlanetId } from '../types.ts';
import { createResourceFlow } from '../core/calculations.ts';

export function createDefaultProject(name: string = 'Space Age 1000 SPM Megabase'): FactoryPlannerProject {
  const now = new Date().toISOString();

  const ironSmelting = {
    id: 'block-nauvis-iron-smelting',
    planetId: 'nauvis' as SolidPlanetId,
    name: 'Iron Plate Smelting',
    iconId: 'iron-plate',
    coordinates: { q: 0, r: 0 },
    blueprintMultiplier: 1,
    inputs: [
      createResourceFlow({
        id: 'iron-ore',
        name: 'Iron Ore',
        isFluid: false,
        ratePerSecond: 400,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 2,
      }),
    ],
    outputs: [
      createResourceFlow({
        id: 'iron-plate',
        name: 'Iron Plate',
        isFluid: false,
        ratePerSecond: 400,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 2,
      }),
    ],
    notes: 'Direct electric furnace foundry array',
  };

  const copperSmelting = {
    id: 'block-nauvis-copper-smelting',
    planetId: 'nauvis' as SolidPlanetId,
    name: 'Copper Plate Smelting',
    iconId: 'copper-plate',
    coordinates: { q: 1, r: -1 }, // North-East neighbor of (0,0)
    blueprintMultiplier: 1,
    inputs: [
      createResourceFlow({
        id: 'copper-ore',
        name: 'Copper Ore',
        isFluid: false,
        ratePerSecond: 400,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 2,
      }),
    ],
    outputs: [
      createResourceFlow({
        id: 'copper-plate',
        name: 'Copper Plate',
        isFluid: false,
        ratePerSecond: 400,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 2,
      }),
    ],
    notes: 'Smelting block dedicated to circuit and mall supply',
  };

  const electronicCircuits = {
    id: 'block-nauvis-green-circuits',
    planetId: 'nauvis' as SolidPlanetId,
    name: 'Electronic Circuits (Green)',
    iconId: 'electronic-circuit',
    coordinates: { q: 1, r: 0 }, // South-East neighbor of (0,0)
    blueprintMultiplier: 1,
    inputs: [
      createResourceFlow({
        id: 'iron-plate',
        name: 'Iron Plate',
        isFluid: false,
        ratePerSecond: 200,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 1,
      }),
      createResourceFlow({
        id: 'copper-plate',
        name: 'Copper Plate',
        isFluid: false,
        ratePerSecond: 300,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 2,
      }),
    ],
    outputs: [
      createResourceFlow({
        id: 'electronic-circuit',
        name: 'Electronic Circuit',
        isFluid: false,
        ratePerSecond: 200,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 2,
      }),
    ],
    notes: 'Direct-insertion wire to green circuit layout',
  };

  const advancedCircuits = {
    id: 'block-nauvis-red-circuits',
    planetId: 'nauvis' as SolidPlanetId,
    name: 'Advanced Circuits (Red)',
    iconId: 'advanced-circuit',
    coordinates: { q: 2, r: 0 }, // Adjacent to green circuits
    blueprintMultiplier: 1,
    inputs: [
      createResourceFlow({
        id: 'electronic-circuit',
        name: 'Electronic Circuit',
        isFluid: false,
        ratePerSecond: 60,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 1,
      }),
      createResourceFlow({
        id: 'copper-plate',
        name: 'Copper Plate',
        isFluid: false,
        ratePerSecond: 120,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 1,
      }),
      createResourceFlow({
        id: 'plastic-bar',
        name: 'Plastic Bar',
        isFluid: false,
        ratePerSecond: 60,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 1,
      }),
    ],
    outputs: [
      createResourceFlow({
        id: 'advanced-circuit',
        name: 'Advanced Circuit',
        isFluid: false,
        ratePerSecond: 30,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 1,
      }),
    ],
    notes: 'Plastic delivered via rail from chemical refining',
  };

  const scienceLab = {
    id: 'block-nauvis-science-nexus',
    planetId: 'nauvis' as SolidPlanetId,
    name: 'Central Lab Complex',
    iconId: 'automation-science-pack',
    coordinates: { q: 0, r: 1 }, // South of (0,0)
    blueprintMultiplier: 1,
    inputs: [
      createResourceFlow({
        id: 'automation-science-pack',
        name: 'Automation Science Pack',
        isFluid: false,
        ratePerSecond: 16.67,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 1,
      }),
      createResourceFlow({
        id: 'logistic-science-pack',
        name: 'Logistic Science Pack',
        isFluid: false,
        ratePerSecond: 16.67,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 1,
      }),
      createResourceFlow({
        id: 'space-science-pack',
        name: 'Space Science Pack',
        isFluid: false,
        ratePerSecond: 16.67,
        wagonCount: 2,
        isLegendary: false,
        allocatedBays: 1,
      }),
    ],
    outputs: [],
    notes: 'Central beaconed laboratory facility consuming all science packs',
  };

  return {
    schemaVersion: '2.1.0',
    id: 'default-space-age-project',
    name,
    createdAt: now,
    updatedAt: now,
    gameVersion: '2.1',
    defaultTrainWagons: 2,
    defaultLegendaryQuality: false,
    planets: {
      nauvis: {
        planetId: 'nauvis',
        name: 'Nauvis',
        blocks: [ironSmelting, copperSmelting, electronicCircuits, advancedCircuits, scienceLab],
        rawIngressNodes: [
          {
            id: 'raw-iron-outpost',
            resourceId: 'iron-ore',
            planetId: 'nauvis',
            name: 'North Iron Patch Depots',
            ratePerSecond: 400,
            coordinates: { q: -1, r: 0 },
          },
          {
            id: 'raw-copper-outpost',
            resourceId: 'copper-ore',
            planetId: 'nauvis',
            name: 'East Copper Patch Depots',
            ratePerSecond: 400,
            coordinates: { q: 2, r: -2 },
          },
          {
            id: 'raw-oil-outpost',
            resourceId: 'crude-oil',
            planetId: 'nauvis',
            name: 'Deep Oil Wells',
            ratePerSecond: 250,
            coordinates: { q: 1, r: 2 },
          },
        ],
        spaceHubs: [
          {
            id: 'hub-nauvis-silo-main',
            type: 'rocket-silo',
            planetId: 'nauvis',
            name: 'Legendary Rocket Silo Alpha',
            coordinates: { q: -1, r: 2 },
            isLegendarySilo: true,
            targetPlatformOrPlanet: 'Nauvis Orbital Hub',
            cargoResourceId: 'space-science-pack',
            ratePerSecond: 16.67,
            launchesPerMinute: 1.0,
          },
          {
            id: 'hub-nauvis-landing-pad',
            type: 'cargo-landing-pad',
            planetId: 'nauvis',
            name: 'Orbital Cargo Landing Pad',
            coordinates: { q: 0, r: 2 },
            isLegendarySilo: true,
            targetPlatformOrPlanet: 'Nauvis Orbital Hub',
            cargoResourceId: 'space-science-pack',
            ratePerSecond: 16.67,
            launchesPerMinute: 1.0,
          },
        ],
      },
      vulcanus: {
        planetId: 'vulcanus',
        name: 'Vulcanus',
        blocks: [],
        rawIngressNodes: [],
        spaceHubs: [],
      },
      gleba: {
        planetId: 'gleba',
        name: 'Gleba',
        blocks: [],
        rawIngressNodes: [],
        spaceHubs: [],
      },
      fulgora: {
        planetId: 'fulgora',
        name: 'Fulgora',
        blocks: [],
        rawIngressNodes: [],
        spaceHubs: [],
      },
      aquilo: {
        planetId: 'aquilo',
        name: 'Aquilo',
        blocks: [],
        rawIngressNodes: [],
        spaceHubs: [],
      },
    },
    spacePlatforms: [
      {
        id: 'platform-nauvis-orbital-1',
        name: 'Nauvis Orbital Staging Platform',
        currentOrbit: 'nauvis',
        producedScience: [
          {
            resourceId: 'space-science-pack',
            ratePerSecond: 16.67,
          },
        ],
        notes: 'Processes space asteroids in orbit and drops space science packs down to Nauvis Cargo Landing Pad.',
      },
    ],
    interplanetaryRoutes: [
      {
        id: 'route-platform-to-nauvis-space-science',
        sourcePlanet: 'platform',
        targetPlanet: 'nauvis',
        sourceHubName: 'Nauvis Orbital Platform',
        targetHubName: 'Orbital Cargo Landing Pad',
        resourceId: 'space-science-pack',
        ratePerSecond: 16.67,
        weightPerItemKg: 1.0,
        capacityPerRocket: 1000,
        launchesPerMinute: 1.0,
        silosRequired: 1,
        notes: 'Direct orbital pod delivery from platform to central labs',
      },
      {
        id: 'route-vulcanus-to-nauvis-metallurgic',
        sourcePlanet: 'vulcanus',
        targetPlanet: 'nauvis',
        sourceHubName: 'Vulcanus Silo Complex',
        targetHubName: 'Nauvis Central Landing Pad',
        resourceId: 'metallurgic-science-pack',
        ratePerSecond: 16.67,
        weightPerItemKg: 1.0,
        capacityPerRocket: 1000,
        launchesPerMinute: 1.0,
        silosRequired: 1,
        notes: 'Shipped via Vulcanus cargo rocket to Nauvis labs',
      },
      {
        id: 'route-gleba-to-nauvis-agricultural',
        sourcePlanet: 'gleba',
        targetPlanet: 'nauvis',
        sourceHubName: 'Gleba Bio-Silo Pad',
        targetHubName: 'Nauvis Central Landing Pad',
        resourceId: 'agricultural-science-pack',
        ratePerSecond: 16.67,
        weightPerItemKg: 1.0,
        capacityPerRocket: 1000,
        launchesPerMinute: 1.0,
        silosRequired: 1,
        notes: 'Time-sensitive delivery to minimize spoilage',
      },
      {
        id: 'route-fulgora-to-nauvis-electromagnetic',
        sourcePlanet: 'fulgora',
        targetPlanet: 'nauvis',
        sourceHubName: 'Fulgora EM Silo Nexus',
        targetHubName: 'Nauvis Central Landing Pad',
        resourceId: 'electromagnetic-science-pack',
        ratePerSecond: 16.67,
        weightPerItemKg: 1.0,
        capacityPerRocket: 1000,
        launchesPerMinute: 1.0,
        silosRequired: 1,
        notes: 'Delivered via platform orbital transfer',
      },
      {
        id: 'route-aquilo-to-nauvis-cryogenic',
        sourcePlanet: 'aquilo',
        targetPlanet: 'nauvis',
        sourceHubName: 'Aquilo Cryo Silo',
        targetHubName: 'Nauvis Central Landing Pad',
        resourceId: 'cryogenic-science-pack',
        ratePerSecond: 16.67,
        weightPerItemKg: 1.0,
        capacityPerRocket: 1000,
        launchesPerMinute: 1.0,
        silosRequired: 1,
        notes: 'Cryogenic science shipped to finish research tree',
      },
    ],
  };
}
