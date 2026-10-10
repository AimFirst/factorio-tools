/**
 * Multi-World Hexagonal Factory Planner (Factorio 2.1 Space Age)
 * Core Type Definitions
 */

export type SolidPlanetId = 'nauvis' | 'vulcanus' | 'gleba' | 'fulgora' | 'aquilo';

export interface PlanetMeta {
  id: SolidPlanetId;
  name: string;
  tagline: string;
  accentColor: string;
  bgGradient: string;
  primaryMechanics: string[];
}

export const PLANETS_META: Record<SolidPlanetId, PlanetMeta> = {
  nauvis: {
    id: 'nauvis',
    name: 'Nauvis',
    tagline: 'The Cradle of Industry',
    accentColor: '#10b981', // Emerald green
    bgGradient: 'from-emerald-950/40 via-zinc-950 to-zinc-950',
    primaryMechanics: ['Standard Smelting & Assembly', 'Lab Science Nexus', 'Nuclear Power'],
  },
  vulcanus: {
    id: 'vulcanus',
    name: 'Vulcanus',
    tagline: 'Volcanic Foundry World',
    accentColor: '#f97316', // Orange / Magma
    bgGradient: 'from-orange-950/40 via-zinc-950 to-zinc-950',
    primaryMechanics: ['Foundries & Direct Casting', 'Calcite Flux', 'Tungsten Metallurgy'],
  },
  gleba: {
    id: 'gleba',
    name: 'Gleba',
    tagline: 'Biological & Agricultural Swamps',
    accentColor: '#84cc16', // Lime / Bio-green
    bgGradient: 'from-lime-950/40 via-zinc-950 to-zinc-950',
    primaryMechanics: ['Biochambers & Nutrients', 'Spoilage Lifecycles', 'Agricultural Science'],
  },
  fulgora: {
    id: 'fulgora',
    name: 'Fulgora',
    tagline: 'Electromagnetic Desert & Ruins',
    accentColor: '#a855f7', // Purple / Lightning
    bgGradient: 'from-purple-950/40 via-zinc-950 to-zinc-950',
    primaryMechanics: ['Scrap Recycling', 'Electromagnetic Plants', 'Holmium Processing'],
  },
  aquilo: {
    id: 'aquilo',
    name: 'Aquilo',
    tagline: 'Cryogenic Frozen Wasteland',
    accentColor: '#06b6d4', // Cyan / Frost
    bgGradient: 'from-cyan-950/40 via-zinc-950 to-zinc-950',
    primaryMechanics: ['Cryogenic Plants', 'Fluorine & Heat Pipes', 'Lithium Chemistry'],
  },
};

/**
 * Axial coordinates (q, r) on a hexagonal grid.
 * q = column diagonal axis
 * r = row vertical axis
 */
export interface HexCoordinates {
  q: number;
  r: number;
}

/**
 * Cube coordinates (x, y, z) where x + y + z = 0.
 */
export interface CubeCoordinates {
  x: number;
  y: number;
  z: number;
}

export type ResourceFlowType = 'input' | 'output';

/**
 * Flow entry for an item or fluid consumed or produced by a block.
 */
export interface BlockResourceFlow {
  id: string; // Factorio item/fluid ID (e.g. 'electronic-circuit')
  name: string;
  isFluid: boolean;
  ratePerSecond: number; // Consumed or produced units per second
  ratePerMinute?: number; // Optional legacy compatibility alias
  wagonCount: number; // Wagons per train (e.g. 2 for 1-2 train)
  isLegendary: boolean; // Legendary wagons and item stack multiplier
  trainCapacity: number; // Calculated capacity per train
  trainsPerMinute: number; // (ratePerSecond * 60) / trainCapacity
  allocatedBays: number; // Dedicated loading or unloading bays
}

/**
 * A manufacturing hexagonal city block on a planet.
 */
export interface HexBlock {
  id: string;
  planetId: SolidPlanetId;
  name: string;
  iconId: string; // Factorio item ID for visual icon
  coordinates: HexCoordinates | null; // null if unassigned in inventory
  blueprintMultiplier: number; // Multiplier for repeated blueprint stamps inside block
  color?: string; // Optional custom border / accent color
  category?: string; // Optional block category tag
  inputs: BlockResourceFlow[];
  outputs: BlockResourceFlow[];
  notes?: string;
}

/**
 * Raw resource perimeter ingress (mining patches, raw wells, scrap fields).
 * These feed into the rail network without requiring a factory block.
 */
export interface RawIngressNode {
  id: string;
  resourceId: string;
  planetId: SolidPlanetId;
  name: string;
  ratePerSecond: number;
  ratePerMinute?: number;
  coordinates: HexCoordinates | null;
  notes?: string;
}

/**
 * Interplanetary logistics hub on a solid planet's surface:
 * Legendary Rocket Silos (launches to orbit) or Cargo Landing Pads (drops from orbit).
 */
export interface SpaceHubNode {
  id: string;
  type: 'rocket-silo' | 'cargo-landing-pad';
  planetId: SolidPlanetId;
  name: string;
  coordinates: HexCoordinates | null;
  isLegendarySilo: true; // Rocket silos in Factorio 2.1 are modeled legendary (+150% speed)
  targetPlatformOrPlanet: string;
  cargoResourceId: string;
  ratePerSecond: number;
  ratePerMinute?: number;
  launchesPerMinute: number; // Computed based on 1,000 kg cargo rocket payload
}

/**
 * Orbital Space Platform (Factorio 2.1).
 * Space Platforms do not have rail blocks; they generate orbital sciences
 * (Space Science, Promethium Science) and transport cargo between planetary orbits.
 */
export interface SpacePlatform {
  id: string;
  name: string;
  currentOrbit: SolidPlanetId | 'solar-system-edge' | 'shattered-planet';
  producedScience: Array<{
    resourceId: 'space-science-pack' | 'promethium-science-pack';
    ratePerSecond: number;
    ratePerMinute?: number;
  }>;
  notes?: string;
}

/**
 * Rail network and logistics state for a single solid planet.
 */
export interface PlanetFactoryState {
  planetId: SolidPlanetId;
  name: string;
  blocks: HexBlock[];
  rawIngressNodes: RawIngressNode[];
  spaceHubs: SpaceHubNode[];
}

export interface InterplanetaryRoute {
  id: string;
  sourcePlanet: SolidPlanetId | 'platform';
  targetPlanet: SolidPlanetId | 'platform';
  sourceHubName?: string;
  targetHubName?: string;
  resourceId: string;
  ratePerSecond: number;
  ratePerMinute?: number;
  weightPerItemKg: number;
  capacityPerRocket: number;
  launchesPerMinute: number;
  silosRequired: number;
  notes?: string;
}

/**
 * Complete project state encompassing all 5 solid planets and space platforms.
 */
export interface FactoryPlannerProject {
  schemaVersion: '2.1.0';
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  gameVersion: '2.1';
  defaultTrainWagons: number;
  defaultLegendaryQuality: boolean;
  planets: Record<SolidPlanetId, PlanetFactoryState>;
  spacePlatforms: SpacePlatform[];
  interplanetaryRoutes: InterplanetaryRoute[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  updatedAt: string;
  blockCount: number;
}

/**
 * Pluggable storage abstraction for persistence and future cross-device synchronization.
 */
export interface StorageAdapter {
  readonly id: string;
  readonly name: string;
  saveProject(project: FactoryPlannerProject): Promise<void>;
  loadProject(id: string): Promise<FactoryPlannerProject | null>;
  listProjects(): Promise<ProjectMetadata[]>;
  deleteProject(id: string): Promise<void>;
  exportJson(project: FactoryPlannerProject): string;
  importJson(json: string): FactoryPlannerProject;
}
