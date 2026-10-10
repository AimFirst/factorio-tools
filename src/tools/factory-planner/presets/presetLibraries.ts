/**
 * Curated Factory Presets for Factorio 2.1 Space Age.
 * Enables 1-click loading of complete megabases and specialized planetary networks.
 */

import type { FactoryPlannerProject, SolidPlanetId, PlanetFactoryState } from '../types.ts';
import { createDefaultProject } from '../storage/starterProject.ts';
import { createResourceFlow } from '../core/calculations.ts';

export interface FactoryPreset {
  id: string;
  name: string;
  planetFocus: SolidPlanetId | 'multi-world';
  description: string;
  badge: string;
  createProject: () => FactoryPlannerProject;
}

function createEmptyPlanet(planetId: SolidPlanetId, name: string): PlanetFactoryState {
  return {
    planetId,
    name,
    blocks: [],
    rawIngressNodes: [],
    spaceHubs: [],
  };
}

// ----------------------------------------------------------------------
// Preset 1: Space Age 1,000 SPM Megabase
// ----------------------------------------------------------------------
const PRESET_1000_SPM: FactoryPreset = {
  id: 'space-age-1000-spm',
  name: 'Space Age 1,000 SPM Megabase',
  planetFocus: 'multi-world',
  description: 'Full multi-world rail network spanning Nauvis, Vulcanus, Gleba, Fulgora, Aquilo, and orbital platforms with 1,000 SPM (16.67/s) of every science pack.',
  badge: 'Multi-World',
  createProject: () => createDefaultProject('Space Age 1000 SPM Megabase'),
};

// ----------------------------------------------------------------------
// Preset 2: Vulcanus Heavy Foundry City Blocks
// ----------------------------------------------------------------------
const PRESET_VULCANUS_FOUNDRY: FactoryPreset = {
  id: 'vulcanus-foundry',
  name: 'Vulcanus Foundry & Metallurgic Complex',
  planetFocus: 'vulcanus',
  description: 'Lava-powered foundry rail blocks featuring direct molten iron/copper smelting, casting machines, tungsten plates, and Metallurgic Science export.',
  badge: 'Vulcanus',
  createProject: () => {
    const proj: FactoryPlannerProject = {
      id: `factory-vulcanus-${Date.now()}`,
      name: 'Vulcanus Heavy Foundry Network',
      gameVersion: '2.1',
      schemaVersion: '2.1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      defaultTrainWagons: 2,
      defaultLegendaryQuality: true,
      planets: {
        nauvis: createEmptyPlanet('nauvis', 'Nauvis'),
        vulcanus: {
          planetId: 'vulcanus',
          name: 'Vulcanus',
          blocks: [
            {
              id: 'v-block-lava-smelting',
              planetId: 'vulcanus',
              name: 'Lava Molten Metal Extraction',
              iconId: 'calcite',
              category: 'smelting',
              blueprintMultiplier: 1,
              coordinates: { q: 0, r: 0 },
              inputs: [
                createResourceFlow({
                  id: 'calcite',
                  name: 'Calcite',
                  isFluid: false,
                  ratePerSecond: 40,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'molten-iron',
                  name: 'Molten Iron',
                  isFluid: true,
                  ratePerSecond: 800,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'molten-copper',
                  name: 'Molten Copper',
                  isFluid: true,
                  ratePerSecond: 400,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'Primary lava pump array with calcite flux reactors.',
            },
            {
              id: 'v-block-iron-casting',
              planetId: 'vulcanus',
              name: 'Direct Iron & Gear Casting Foundry',
              iconId: 'iron-plate',
              category: 'manufacturing',
              blueprintMultiplier: 1,
              coordinates: { q: 1, r: -1 },
              inputs: [
                createResourceFlow({
                  id: 'molten-iron',
                  name: 'Molten Iron',
                  isFluid: true,
                  ratePerSecond: 500,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'iron-plate',
                  name: 'Iron Plate',
                  isFluid: false,
                  ratePerSecond: 250,
                  wagonCount: 4,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'iron-gear-wheel',
                  name: 'Iron Gear Wheel',
                  isFluid: false,
                  ratePerSecond: 120,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'Legendary Foundry modules casting iron plates and gears without intermediate ingots.',
            },
            {
              id: 'v-block-steel-casting',
              planetId: 'vulcanus',
              name: 'Molten Steel Casting Facility',
              iconId: 'steel-plate',
              category: 'manufacturing',
              blueprintMultiplier: 1,
              coordinates: { q: 1, r: 0 },
              inputs: [
                createResourceFlow({
                  id: 'molten-iron',
                  name: 'Molten Iron',
                  isFluid: true,
                  ratePerSecond: 250,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'steel-plate',
                  name: 'Steel Plate',
                  isFluid: false,
                  ratePerSecond: 50,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'Continuous steel casting directly from molten iron.',
            },
            {
              id: 'v-block-tungsten-smelting',
              planetId: 'vulcanus',
              name: 'Tungsten Carbide & Plate Complex',
              iconId: 'tungsten-plate',
              category: 'advanced',
              blueprintMultiplier: 1,
              coordinates: { q: 0, r: 1 },
              inputs: [
                createResourceFlow({
                  id: 'tungsten-ore',
                  name: 'Tungsten Ore',
                  isFluid: false,
                  ratePerSecond: 100,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'sulfuric-acid',
                  name: 'Sulfuric Acid',
                  isFluid: true,
                  ratePerSecond: 200,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'tungsten-plate',
                  name: 'Tungsten Plate',
                  isFluid: false,
                  ratePerSecond: 50,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'tungsten-carbide',
                  name: 'Tungsten Carbide',
                  isFluid: false,
                  ratePerSecond: 25,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'Heavy acid leaching and sintering for high-density tungsten alloys.',
            },
            {
              id: 'v-block-metallurgic-science',
              planetId: 'vulcanus',
              name: 'Metallurgic Science Silo Nexus',
              iconId: 'metallurgic-science-pack',
              category: 'science',
              blueprintMultiplier: 1,
              coordinates: { q: -1, r: 1 },
              inputs: [
                createResourceFlow({
                  id: 'tungsten-carbide',
                  name: 'Tungsten Carbide',
                  isFluid: false,
                  ratePerSecond: 16.67,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'copper-plate',
                  name: 'Copper Plate',
                  isFluid: false,
                  ratePerSecond: 33.33,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'metallurgic-science-pack',
                  name: 'Metallurgic Science Pack',
                  isFluid: false,
                  ratePerSecond: 16.67,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'Produces 16.67/s metallurgic science directly fed to legendary rocket silos.',
            },
          ],
          rawIngressNodes: [
            {
              id: 'v-raw-calcite',
              name: 'Calcite Quarry Outpost',
              planetId: 'vulcanus',
              resourceId: 'calcite',
              ratePerSecond: 60,
              coordinates: { q: -1, r: -1 },
              notes: 'High-yield calcite deposit rail terminus.',
            },
            {
              id: 'v-raw-tungsten',
              name: 'Volcanic Tungsten Mines',
              planetId: 'vulcanus',
              resourceId: 'tungsten-ore',
              ratePerSecond: 133,
              coordinates: { q: 0, r: 2 },
              notes: 'Acid-fed big mining drill cluster.',
            },
          ],
          spaceHubs: [
            {
              id: 'v-hub-silo-export',
              type: 'rocket-silo',
              planetId: 'vulcanus',
              name: 'Vulcanus Orbital Launch Silo',
              coordinates: { q: -2, r: 1 },
              isLegendarySilo: true,
              targetPlatformOrPlanet: 'Nauvis Central Landing Pad',
              cargoResourceId: 'metallurgic-science-pack',
              ratePerSecond: 16.67,
              launchesPerMinute: 1.0,
            },
          ],
        },
        gleba: createEmptyPlanet('gleba', 'Gleba'),
        fulgora: createEmptyPlanet('fulgora', 'Fulgora'),
        aquilo: createEmptyPlanet('aquilo', 'Aquilo'),
      },
      spacePlatforms: [
        {
          id: 'platform-vulcanus-ferry',
          name: 'Vulcanus-Nauvis Science Ferry',
          currentOrbit: 'vulcanus',
          producedScience: [],
          notes: 'Automated nuclear cargo ship transporting metallurgic science packs to Nauvis.',
        },
      ],
      interplanetaryRoutes: [
        {
          id: 'route-vulcanus-export',
          sourcePlanet: 'vulcanus',
          targetPlanet: 'nauvis',
          sourceHubName: 'Vulcanus Orbital Launch Silo',
          targetHubName: 'Nauvis Central Landing Pad',
          resourceId: 'metallurgic-science-pack',
          ratePerSecond: 16.67,
          weightPerItemKg: 1.0,
          capacityPerRocket: 1000,
          launchesPerMinute: 1.0,
          silosRequired: 1,
          notes: 'Direct cargo rocket shipment to Nauvis labs',
        },
      ],
    };
    return proj;
  },
};

// ----------------------------------------------------------------------
// Preset 3: Fulgora Scrap & Electromagnetic Hub
// ----------------------------------------------------------------------
const PRESET_FULGORA_SCRAP: FactoryPreset = {
  id: 'fulgora-scrap',
  name: 'Fulgora Scrap & Electromagnetic Hub',
  planetFocus: 'fulgora',
  description: 'Island rail network optimized for lightning harvesting, scrap recycling, holmium leaching, superconductors, and Electromagnetic Science.',
  badge: 'Fulgora',
  createProject: () => {
    const proj: FactoryPlannerProject = {
      id: `factory-fulgora-${Date.now()}`,
      name: 'Fulgora Electromagnetic Scrap Megabase',
      gameVersion: '2.1',
      schemaVersion: '2.1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      defaultTrainWagons: 2,
      defaultLegendaryQuality: true,
      planets: {
        nauvis: createEmptyPlanet('nauvis', 'Nauvis'),
        vulcanus: createEmptyPlanet('vulcanus', 'Vulcanus'),
        gleba: createEmptyPlanet('gleba', 'Gleba'),
        fulgora: {
          planetId: 'fulgora',
          name: 'Fulgora',
          blocks: [
            {
              id: 'f-block-scrap-recycling',
              planetId: 'fulgora',
              name: 'Central Scrap Recycler Nexus',
              iconId: 'scrap',
              category: 'manufacturing',
              blueprintMultiplier: 1,
              coordinates: { q: 0, r: 0 },
              inputs: [
                createResourceFlow({
                  id: 'scrap',
                  name: 'Scrap',
                  isFluid: false,
                  ratePerSecond: 800,
                  wagonCount: 4,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'processing-unit',
                  name: 'Processing Unit',
                  isFluid: false,
                  ratePerSecond: 13.33,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'steel-plate',
                  name: 'Steel Plate',
                  isFluid: false,
                  ratePerSecond: 50,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'holmium-ore',
                  name: 'Holmium Ore',
                  isFluid: false,
                  ratePerSecond: 40,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'Massive legendary recyclers sorting scrap into high-tier electronics and raw metals.',
            },
            {
              id: 'f-block-holmium-leaching',
              planetId: 'fulgora',
              name: 'Holmium Solution & Plate Refinery',
              iconId: 'holmium-plate',
              category: 'advanced',
              blueprintMultiplier: 1,
              coordinates: { q: 1, r: -1 },
              inputs: [
                createResourceFlow({
                  id: 'holmium-ore',
                  name: 'Holmium Ore',
                  isFluid: false,
                  ratePerSecond: 40,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'holmium-plate',
                  name: 'Holmium Plate',
                  isFluid: false,
                  ratePerSecond: 20,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'Refines rare earth holmium into high-performance conductor plates.',
            },
            {
              id: 'f-block-superconductors',
              planetId: 'fulgora',
              name: 'Superconductor & Supercapacitor Foundry',
              iconId: 'superconductor',
              category: 'manufacturing',
              blueprintMultiplier: 1,
              coordinates: { q: 1, r: 0 },
              inputs: [
                createResourceFlow({
                  id: 'holmium-plate',
                  name: 'Holmium Plate',
                  isFluid: false,
                  ratePerSecond: 20,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'copper-cable',
                  name: 'Copper Cable',
                  isFluid: false,
                  ratePerSecond: 80,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'superconductor',
                  name: 'Superconductor',
                  isFluid: false,
                  ratePerSecond: 16.67,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'supercapacitor',
                  name: 'Supercapacitor',
                  isFluid: false,
                  ratePerSecond: 16.67,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'High-tech electromagnetic sub-assemblies for research packs and railguns.',
            },
            {
              id: 'f-block-em-science',
              planetId: 'fulgora',
              name: 'Electromagnetic Science Complex',
              iconId: 'electromagnetic-science-pack',
              category: 'science',
              blueprintMultiplier: 1,
              coordinates: { q: 0, r: 1 },
              inputs: [
                createResourceFlow({
                  id: 'superconductor',
                  name: 'Superconductor',
                  isFluid: false,
                  ratePerSecond: 16.67,
                  wagonCount: 2,
                  isLegendary: true,
                }),
                createResourceFlow({
                  id: 'supercapacitor',
                  name: 'Supercapacitor',
                  isFluid: false,
                  ratePerSecond: 16.67,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              outputs: [
                createResourceFlow({
                  id: 'electromagnetic-science-pack',
                  name: 'Electromagnetic Science Pack',
                  isFluid: false,
                  ratePerSecond: 16.67,
                  wagonCount: 2,
                  isLegendary: true,
                }),
              ],
              notes: 'Generates 16.67/s EM Science and loads directly into legendary launch silos.',
            },
          ],
          rawIngressNodes: [
            {
              id: 'f-raw-scrap-ruins',
              name: 'Ancient City Scrap Terminal',
              planetId: 'fulgora',
              resourceId: 'scrap',
              ratePerSecond: 1000,
              coordinates: { q: -1, r: 0 },
              notes: 'Multi-island big mining drill train station.',
            },
          ],
          spaceHubs: [
            {
              id: 'f-hub-em-silo',
              type: 'rocket-silo',
              planetId: 'fulgora',
              name: 'Fulgora EM Silo Nexus',
              coordinates: { q: -1, r: 1 },
              isLegendarySilo: true,
              targetPlatformOrPlanet: 'Nauvis Central Landing Pad',
              cargoResourceId: 'electromagnetic-science-pack',
              ratePerSecond: 16.67,
              launchesPerMinute: 1.0,
            },
          ],
        },
        aquilo: createEmptyPlanet('aquilo', 'Aquilo'),
      },
      spacePlatforms: [],
      interplanetaryRoutes: [
        {
          id: 'route-fulgora-em-export',
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
          notes: 'Fulgora science orbital ferry to Nauvis',
        },
      ],
    };
    return proj;
  },
};

export const FACTORY_PRESETS: FactoryPreset[] = [
  PRESET_1000_SPM,
  PRESET_VULCANUS_FOUNDRY,
  PRESET_FULGORA_SCRAP,
];
