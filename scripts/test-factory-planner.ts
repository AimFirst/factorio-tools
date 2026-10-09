import assert from 'node:assert';
import {
  axialToCube,
  cubeToAxial,
  hexDistance,
  getHexNeighbors,
  hexToPixel,
  pixelToHex,
} from '../src/tools/factory-planner/core/hex-math.ts';
import {
  calculateSiloLaunches,
  createResourceFlow,
} from '../src/tools/factory-planner/core/calculations.ts';
import { createDefaultProject } from '../src/tools/factory-planner/storage/starterProject.ts';
import { LocalStorageAdapter } from '../src/tools/factory-planner/storage/LocalStorageAdapter.ts';
import { calculatePlanetTraffic } from '../src/tools/factory-planner/core/traffic-engine.ts';
import { optimizeBlockLayout } from '../src/tools/factory-planner/core/optimizer.ts';

console.log('🧪 Testing Factorio 2.1 Hexagonal Factory Planner Engine...\n');

// -------------------------------------------------------------
// Test 1: Hexagonal Coordinates and Distance
// -------------------------------------------------------------
{
  const origin = { q: 0, r: 0 };
  const north = { q: 0, r: -1 };
  const south = { q: 0, r: 1 };
  const northEast = { q: 1, r: -1 };
  const southEast = { q: 1, r: 0 };
  const northWest = { q: -1, r: 0 };
  const southWest = { q: -1, r: 1 };

  // All 6 immediate neighbors must have distance = 1
  assert.strictEqual(hexDistance(origin, north), 1);
  assert.strictEqual(hexDistance(origin, south), 1);
  assert.strictEqual(hexDistance(origin, northEast), 1);
  assert.strictEqual(hexDistance(origin, southEast), 1);
  assert.strictEqual(hexDistance(origin, northWest), 1);
  assert.strictEqual(hexDistance(origin, southWest), 1);

  // Distance symmetry
  assert.strictEqual(hexDistance(northEast, origin), 1);

  // 2-hop neighbor distance
  const twoHops = { q: 2, r: 0 };
  assert.strictEqual(hexDistance(origin, twoHops), 2);

  // Axial <-> Cube roundtrip
  const cube = axialToCube(origin);
  assert.strictEqual(cube.x + cube.y + cube.z, 0);
  const backToAxial = cubeToAxial(cube);
  assert.deepStrictEqual(backToAxial, origin);

  // Neighbors list check
  const neighbors = getHexNeighbors(origin);
  assert.strictEqual(neighbors.length, 6);

  console.log('✅ Test 1: Hexagonal Coordinate and Distance Math passed.');
}

// -------------------------------------------------------------
// Test 2: Pixel Projection and Inversion
// -------------------------------------------------------------
{
  const radius = 60;
  const hex = { q: 2, r: -1 };
  const pixel = hexToPixel(hex, radius);
  const inverted = pixelToHex(pixel.x, pixel.y, radius);

  assert.strictEqual(inverted.q, hex.q);
  assert.strictEqual(inverted.r, hex.r);
  console.log('✅ Test 2: Hex to Pixel Projection and Roundtrip Inversion passed.');
}

// -------------------------------------------------------------
// Test 3: Block Flow Metrics (Items & Fluids)
// -------------------------------------------------------------
{
  // 12,000 Electronic Circuits/min with 2 standard wagons
  // Electronic circuit stack size = 200, 2 wagons * 40 slots * 200 = 16,000 items/train
  const flow = createResourceFlow({
    id: 'electronic-circuit',
    name: 'Electronic Circuit',
    isFluid: false,
    ratePerMinute: 12000,
    wagonCount: 2,
    isLegendary: false,
  });

  assert.strictEqual(flow.trainCapacity, 16000);
  assert.strictEqual(flow.trainsPerMinute, 12000 / 16000); // 0.75 trains/min
  console.log(`✅ Test 3: Resource Flow Metrics passed (Train cap: ${flow.trainCapacity}, Trains/min: ${flow.trainsPerMinute}).`);
}

// -------------------------------------------------------------
// Test 4: Legendary Rocket Silo Launches (Factorio 2.1)
// -------------------------------------------------------------
{
  // 1,000 space science packs/min. Weight = 1.0 kg/item. Rocket capacity = 1000 items (1000 kg).
  const silo = calculateSiloLaunches({
    cargoResourceId: 'space-science-pack',
    ratePerMinute: 1000,
  });

  assert.strictEqual(silo.weightPerItemKg, 1.0);
  assert.strictEqual(silo.capacityPerRocket, 1000);
  assert.strictEqual(silo.launchesPerMinute, 1.0);
  console.log(`✅ Test 4: Legendary Rocket Silo Math passed (${silo.launchesPerMinute} launch/min for 1000 space science packs).`);
}

// -------------------------------------------------------------
// Test 5: Default Factory Project Schema & 5 Solid Planets
// -------------------------------------------------------------
{
  const project = createDefaultProject('Space Age Test Project');

  assert.strictEqual(project.gameVersion, '2.1');
  assert.strictEqual(project.schemaVersion, '2.1.0');
  assert.strictEqual(Object.keys(project.planets).length, 5);
  assert(project.planets.nauvis);
  assert(project.planets.vulcanus);
  assert(project.planets.gleba);
  assert(project.planets.fulgora);
  assert(project.planets.aquilo);

  // Nauvis must have pre-configured blocks
  assert(project.planets.nauvis.blocks.length >= 4);
  assert(project.planets.nauvis.rawIngressNodes.length >= 2);
  assert(project.planets.nauvis.spaceHubs.length >= 2);
  assert(project.spacePlatforms.length >= 1);

  console.log(`✅ Test 5: Default Starter Project passed (${project.planets.nauvis.blocks.length} Nauvis blocks, ${project.spacePlatforms.length} space platform).`);
}

// -------------------------------------------------------------
// Test 6: Storage Adapter & JSON Serialization Roundtrip
// -------------------------------------------------------------
async function runStorageTest() {
  const adapter = new LocalStorageAdapter();
  const testProject = createDefaultProject('Persistence Test Factory');
  testProject.id = 'test-proj-123';

  // Save
  await adapter.saveProject(testProject);

  // Load
  const loaded = await adapter.loadProject('test-proj-123');
  assert(loaded);
  assert.strictEqual(loaded.name, 'Persistence Test Factory');
  assert.strictEqual(loaded.planets.nauvis.blocks.length, testProject.planets.nauvis.blocks.length);

  // List
  const list = await adapter.listProjects();
  assert(list.some(p => p.id === 'test-proj-123'));

  // Export JSON
  const exported = adapter.exportJson(loaded);
  assert(typeof exported === 'string');

  // Import JSON
  const imported = adapter.importJson(exported);
  assert.strictEqual(imported.id, loaded.id);
  assert.strictEqual(imported.gameVersion, '2.1');

  // Delete
  await adapter.deleteProject('test-proj-123');
  const afterDelete = await adapter.loadProject('test-proj-123');
  assert.strictEqual(afterDelete, null);

  console.log('✅ Test 6: StorageAdapter Save/Load/Export/Import Roundtrip passed.');
}

// -------------------------------------------------------------
// Test 7: Traffic Flow Reconciliation & Route Generation
// -------------------------------------------------------------
{
  const starter = createDefaultProject();
  const nauvis = starter.planets.nauvis;

  const traffic = calculatePlanetTraffic({
    blocks: nauvis.blocks,
    rawIngressNodes: nauvis.rawIngressNodes,
    spaceHubs: nauvis.spaceHubs,
  });

  assert(traffic.routes.length >= 4, `Expected >= 4 routes, got ${traffic.routes.length}`);
  assert(traffic.totalTrainTripsPerMin > 0, 'Total train trips per min should be > 0');
  assert(traffic.totalTransitCost > 0, 'Total transit cost should be > 0');

  // Verify an iron flow route exists
  const ironRoute = traffic.routes.find((r) => r.resourceId === 'iron-plate');
  assert(ironRoute, 'Expected iron-plate traffic route to exist');
  assert(ironRoute.trainsPerMinute > 0, 'Iron plate train trips should be > 0');

  console.log(
    `✅ Test 7: Traffic Engine passed (${traffic.routes.length} corridors, ${traffic.totalTrainTripsPerMin.toFixed(2)} trains/m, cost: ${traffic.totalTransitCost.toFixed(2)}).`
  );
}

// -------------------------------------------------------------
// Test 8: Simulated Annealing Layout Optimizer
// -------------------------------------------------------------
{
  const starter = createDefaultProject();
  const nauvis = starter.planets.nauvis;

  // Deliberately scatter blocks far away
  const scatteredBlocks = nauvis.blocks.map((b, i) => ({
    ...b,
    coordinates: { q: i * 8, r: i * 8 },
  }));

  const opt = optimizeBlockLayout({
    blocks: scatteredBlocks,
    rawIngressNodes: nauvis.rawIngressNodes,
    spaceHubs: nauvis.spaceHubs,
    options: {
      iterations: 3000,
      temperature: 50,
      coolingRate: 0.998,
    },
  });

  assert(opt.optimizedPlacements.size === scatteredBlocks.length, 'All blocks must be placed');
  assert(
    opt.optimizedTransitCost <= opt.initialTransitCost,
    `Optimized cost (${opt.optimizedTransitCost}) should be <= initial cost (${opt.initialTransitCost})`
  );

  // Check no overlapping coordinates
  const placedCoords = new Set<string>();
  for (const coords of opt.optimizedPlacements.values()) {
    const k = `${coords.q},${coords.r}`;
    assert(!placedCoords.has(k), `Duplicate hex coordinate found: ${k}`);
    placedCoords.add(k);
  }

  console.log(
    `✅ Test 8: Layout Optimizer passed (${opt.improvementPercent.toFixed(1)}% reduction, initial: ${opt.initialTransitCost.toFixed(1)} -> optimized: ${opt.optimizedTransitCost.toFixed(1)}).`
  );
}

runStorageTest().then(() => {
  console.log('\n🎉 ALL FACTORY PLANNER TESTS PASSED SUCCESSFULLY!');
}).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
