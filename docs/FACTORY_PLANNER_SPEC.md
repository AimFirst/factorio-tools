# Factorio 2.1 Multi-World Hexagonal Factory Planner Specification

This document serves as the master architectural specification and phased implementation guide for the **Multi-World Hexagonal Factory Planner** feature in `factorio-tools`. Any future development session or AI agent working on this feature should follow the patterns, schemas, and algorithms outlined here.

---

## 1. Executive Summary & Vision

The Factory Planner is a macroscopic, multi-planetary logistics and layout planning engine designed for **Factorio 2.1 (Space Age)** players building modular **hexagonal rail city blocks**.

### Core Value Proposition
1. **Block Throughput Definition**: Define factory city blocks with both input requirements and output production rates, computing exact train trips per minute and loading/unloading bay requirements.
2. **Hexagonal Spatial Optimization**: Place blocks onto a hexagonal grid layout where the planner analyzes inter-block train traffic and automatically optimizes placement to minimize total train transit distance and railway congestion.
3. **Space Age Multi-World Support (Factorio 2.1)**:
   * Model independent rail networks across all 5 solid planets: **Nauvis**, **Vulcanus**, **Gleba**, **Fulgora**, and **Aquilo**.
   * **Space Platforms as Orbital Logistics Hubs**: Space platforms do not have rail blocks; instead, they operate as orbital production & transit nodes (producing Space Science and Promethium Science, and ferrying cargo). On planet hex grids, orbital interactions are modeled as **Space Ingress / Cargo Drop / Rocket Silo Hubs**.
4. **Legendary Rocket Silos**: All rocket silos are modeled with **Legendary Quality** (+150% / 2.5x crafting speed, reduced launch cycle delay), computing exact rocket launch rates, rocket parts production, and cargo pod payload capacities.
5. **Outpost & Raw Resource Handling**: Abstract raw mining outposts (ores, fluids, scrap) as perimeter ingress supplies without forcing full factory block overhead.
6. **Pluggable Persistence & Cross-Device Sharing**:
   * Storage is abstracted behind a clean `StorageAdapter` interface.
   * Starts with zero-config `LocalStorageAdapter` + JSON Export/Import + URL permalink sharing.
   * Designed to effortlessly plug in cloud synchronization (e.g., Supabase, Firebase, GitHub Gist, or Cloudflare KV) for seamless cross-device synchronization in the future.
7. **Extensibility**: Modular domain logic separated from UI components, fitting seamlessly into the tool registry alongside existing tools like the Train Station Allocator.

---

## 2. Hexagonal Grid Geometry & Math

### 2.1 Hexagon Orientation
Per design requirements, blocks are hexagons with horizontal top and bottom borders:
* **Top border** (North)
* **Bottom border** (South)
* **Top-left border** (North-West)
* **Top-right border** (North-East)
* **Bottom-left border** (South-West)
* **Bottom-right border** (South-East)

> **Geometry Note**: In standard hex geometry terminology, this is a **pointy-sides / horizontal-edges** hexagon. The top and bottom are flat horizontal line segments, and the left and right sides taper to vertices (West and East points).

```
          _______________  (Top border)
         /               \
 (TL)   /                 \  (TR)
       /                   \
       \                   /
 (BL)   \                 /  (BR)
         \_______________/ (Bottom border)
```

### 2.2 Coordinate System (Axial & Cube)
To enable robust distance calculations, rotations, and neighbor queries:
* **Axial Coordinates**: `(q, r)`
  * `q`: Column index (running along the diagonal / slanted axis)
  * `r`: Row index (running vertically)
* **Cube Coordinates**: `(x, y, z)` where $x + y + z = 0$:
  * $x = q$
  * $z = r$
  * $y = -x - z = -q - r$

### 2.3 Distance Metric
The distance between two hexagonal blocks $A(x_1, y_1, z_1)$ and $B(x_2, y_2, z_2)$ is:
$$\text{Dist}(A, B) = \frac{|x_1 - x_2| + |y_1 - y_2| + |z_1 - z_2|}{2}$$

In a Factorio rail network, rail paths follow the block perimeters. Hex metric distance directly correlates with train travel track length, making it ideal for travel cost calculations.

### 2.4 Pixel Projection (SVG / Canvas)
For radius $R$ (distance from center to vertices):
* Width of hex: $W = 2 \times R$
* Height of hex: $H = \sqrt{3} \times R$
* Horizontal distance between adjacent column centers: $\Delta X = \frac{3}{2} \times R$
* Vertical distance between adjacent row centers: $\Delta Y = \sqrt{3} \times R$
* Staggering: Odd columns offset vertically by $\frac{\sqrt{3}}{2} \times R$.

---

## 3. Data Architecture & Schemas

### 3.1 Block Definition
A **HexBlock** represents an individual rail block on a planet:

```typescript
export interface BlockResourceFlow {
  id: string;              // Factorio item or fluid ID (e.g. 'electronic-circuit')
  isFluid: boolean;
  ratePerMinute: number;   // Required consumption (input) or production (output)
  wagonCount: number;      // Train configuration (e.g., 2 for 1-2 trains)
  isLegendary: boolean;    // Uses legendary wagons & stack sizes
  trainsPerMinute: number; // Computed: ratePerMinute / trainCapacity
  allocatedBays?: number;  // Number of loading / unloading bays
}

export interface HexCoordinates {
  q: number; // axial q
  r: number; // axial r
}

export interface HexBlock {
  id: string;
  planetId: SolidPlanetId;
  name: string;
  iconId: string;               // Main primary product icon or custom icon
  coordinates: HexCoordinates | null; // null if unplaced in inventory
  blueprintMultiplier: number;
  color?: string;
  inputs: BlockResourceFlow[];
  outputs: BlockResourceFlow[];
  notes?: string;
}
```

### 3.2 Planet & Orbital Architecture
In Factorio 2.1, rail grids only exist on solid planets:
```typescript
export type SolidPlanetId = 'nauvis' | 'vulcanus' | 'gleba' | 'fulgora' | 'aquilo';

export interface SpacePlatform {
  id: string;
  name: string;
  location: SolidPlanetId | 'solar-system-edge' | 'shattered-planet';
  producedScience: {
    resourceId: 'space-science-pack' | 'promethium-science-pack';
    ratePerMinute: number;
  }[];
  notes?: string;
}

export interface PlanetFactoryState {
  planetId: SolidPlanetId;
  name: string;
  blocks: HexBlock[];
  rawIngressNodes: RawIngressNode[]; // Outpost supplies feeding into this planet's rail network
  spaceHubs: SpaceHubNode[];         // Legendary Rocket Silos & Cargo Landing Pads
}

export interface SpaceHubNode {
  id: string;
  type: 'rocket-silo' | 'cargo-landing-pad';
  name: string;
  coordinates?: HexCoordinates;      // Position on the planet's hex grid
  isLegendarySilo: true;             // Always legendary (2.5x crafting speed, faster launches)
  targetPlatformOrPlanet: string;
  cargoResourceId: string;
  ratePerMinute: number;
  launchesPerMinute: number;
}
```

### 3.3 Interplanetary & Rocket Staging (Factorio 2.1 Rules)
* **Legendary Rocket Silo**:
  * Base craft speed = 1.0 $\to$ Legendary craft speed = 2.5 (2.5x speed).
  * Reduced launch sequence cooldown.
  * Rocket capacity: 1,000 kg per rocket pod drop/launch.
  * Launches per minute:
    $$\text{Launches/min} = \frac{\text{Rate/min} \times \text{WeightPerItem (kg)}}{1,000\text{ kg}}$$
* **Orbital Imports**:
  * Space Science: Produced on platforms in orbit $\to$ dropped to Cargo Landing Pad block on Nauvis.
  * Promethium Science: Produced on Shattered Planet platform $\to$ ferried to Nauvis / Aquilo.
  * Planet-to-Planet exports: Vulcanus Calcite/Tungsten, Gleba Bioflux/Spoilage, Fulgora Holmium, Aquilo Quantum/Lithium.

### 3.4 Raw Resources & Mining Ingress
Raw resources (Iron Ore, Copper Ore, Crude Oil, Calcite, Scrap, etc.) do not require dedicated manufacturing blocks. They are modeled as **RawIngressNodes**:
```typescript
export interface RawIngressNode {
  id: string;
  resourceId: string;
  planetId: SolidPlanetId;
  name: string;
  ratePerMinute: number;
  coordinates?: HexCoordinates; // Optional perimeter depot on the hex grid
}
```

### 3.5 Storage Architecture & Cross-Device Sharing
To guarantee that data can later be shared between computers seamlessly without refactoring UI components, we define a pluggable storage interface:

```typescript
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
}

export interface StorageAdapter {
  readonly id: string;
  saveProject(project: FactoryPlannerProject): Promise<void>;
  loadProject(id: string): Promise<FactoryPlannerProject | null>;
  listProjects(): Promise<Array<{ id: string; name: string; updatedAt: string }>>;
  exportJson(project: FactoryPlannerProject): string;
  importJson(json: string): FactoryPlannerProject;
}
```
* **Phase 1 Implementation**: `LocalStorageAdapter` + JSON Export/Import + URL Permalink sharing (lz-string compressed).
* **Future Extension (Phase 7 / Cloud)**: Drop-in `CloudStorageAdapter` (e.g. Supabase, Firebase, or GitHub Gist) by simply implementing `StorageAdapter`.

---

## 4. Train Traffic Flow & Layout Optimizer

### 4.1 Traffic Flow Graph
1. For each resource on a planet:
   * Total Output Producers: Blocks with that item in `outputs`.
   * Total Input Consumers: Blocks with that item in `inputs`.
2. Proportional flow distribution:
   * If Block $P$ produces $O_P$ and Block $C$ consumes $I_C$, the flow $F(P \to C)$ is determined by proportional balance or nearest-neighbor dispatch.
   * Train trips per minute:
     $$T(P \to C) = \frac{F(P \to C)}{\text{TrainCapacity}(\text{resource})}$$

### 4.2 Objective Function (Travel Cost)
For all pairs of blocks $(A, B)$ exchanging train traffic:
$$\text{Cost} = \sum_{(A, B)} T(A \to B) \times \text{Dist}(A.\text{coords}, B.\text{coords})$$

Where:
* $T(A \to B)$ = Trains per minute between $A$ and $B$.
* $\text{Dist}(A, B)$ = Hex coordinate distance between $A$ and $B$.

### 4.3 Layout Optimization Engine
1. **Interactive Placement**: Users can drag and drop blocks freely onto the hex grid. Real-time cost updates and traffic line heatmaps display congested paths.
2. **Auto-Layout Solver**:
   * **Algorithm**: Simulated Annealing / Force-Directed Graph Layout adapted for hexagonal lattice snapping.
   * **Constraints**: No two blocks can share the same `(q, r)` coordinates; blocks must remain contiguous or clustered around raw ingress nodes.
   * **Preset Seeds**: Option to arrange by production tier (Smelting -> Intermediates -> High-Tech -> Science).

---

## 5. Implementation Roadmap

The implementation is broken down into structured phases:

| Phase | Title | Key Deliverables | Status |
|---|---|---|---|
| **Phase 1** | **Data Models & Storage Engine** | Factorio 2.1 schemas (`types.ts`), `StorageAdapter` interface, `LocalStorageAdapter`, JSON import/export, starter Nauvis factory. | Completed |
| **Phase 2** | **Enhanced Block Editor & Calculator** | Input & Output resource table, train trips/min calculation, bay requirements, legendary quality toggles, Station Allocator linking. | Completed |
| **Phase 3** | **Interactive Hex Grid Canvas** | SVG/Canvas renderer for horizontal-topped hexagons, pan/zoom controls, block placement/removal, coordinate tooltip. | Pending |
| **Phase 4** | **Traffic Flow Graph & Distance Optimizer** | Flow reconciliation engine, inter-block train frequency matrices, visual flow arcs/heatmaps, Simulated Annealing placement solver. | Pending |
| **Phase 5** | **Space Age Multi-Planet & Legendary Silo System** | 5 Solid Planets switcher, Space Platforms orbital hub, Legendary Rocket Silo math (2.5x speed, 1000kg payloads), interplanetary routes. | Pending |
| **Phase 6** | **Polish, Tool Registry & Integration** | Register `factory-planner` in `registry.ts`, project manager UI, URL permalink sharing, responsive design polish. | Pending |
| **Phase 7** | **Cloud Cross-Device Sync (Future)** | Supabase / GitHub Gist / Firebase adapter implementation of `StorageAdapter`. | Planned |

---

## 6. Instructions for Future AI Agents & Developers

When picking up work on this codebase in future sessions:
1. **Always refer to this document (`docs/FACTORY_PLANNER_SPEC.md`)** for data structures, formulas, and UI requirements.
2. **Follow Existing Patterns**:
   * Target Factorio 2.1 (Space Age).
   * Use TypeScript strictly.
   * Use Tailwind CSS v4 for UI components.
   * Use `lucide-react` for standard icons.
   * Leverage `factorioData` from `src/lib/factorio.ts` for item metadata, stack sizes, and wagon capacities.
   * All rocket silos must default to Legendary quality.
   * Solid planets have hex grids; Space Platforms are orbital hubs that provide science packs and transport cargo.
3. **Keep State Decoupled**: Separate calculation engines (`src/tools/factory-planner/core/`) from React UI components (`src/tools/factory-planner/components/`).
4. **Preserve User Data**: Keep storage operations using the `StorageAdapter` pattern to facilitate cloud sync.
