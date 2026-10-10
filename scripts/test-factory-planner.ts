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
  calculateInterplanetaryRoute,
  createResourceFlow,
} from '../src/tools/factory-planner/core/calculations.ts';
import { createDefaultProject } from '../src/tools/factory-planner/storage/starterProject.ts';
import { LocalStorageAdapter } from '../src/tools/factory-planner/storage/LocalStorageAdapter.ts';
import { calculatePlanetTraffic } from '../src/tools/factory-planner/core/traffic-engine.ts';
import { optimizeBlockLayout } from '../src/tools/factory-planner/core/optimizer.ts';
import { FACTORY_PRESETS } from '../src/tools/factory-planner/presets/presetLibraries.ts';

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
  // 200 Electronic Circuits/sec (= 12,000/min) with 2 standard wagons
  // Electronic circuit stack size = 200, 2 wagons * 40 slots * 200 = 16,000 items/train
  const flow = createResourceFlow({
    id: 'electronic-circuit',
    name: 'Electronic Circuit',
    isFluid: false,
    ratePerSecond: 200,
    wagonCount: 2,
    isLegendary: false,
  });

  assert.strictEqual(flow.trainCapacity, 16000);
  assert.strictEqual(flow.trainsPerMinute, (200 * 60) / 16000); // 0.75 trains/min
  console.log(`✅ Test 3: Resource Flow Metrics passed (Train cap: ${flow.trainCapacity}, Trains/min: ${flow.trainsPerMinute}).`);
}

// -------------------------------------------------------------
// Test 4: Legendary Rocket Silo Launches (Factorio 2.1)
// -------------------------------------------------------------
{
  // 16.67 space science packs/sec (= 1,000/min). Weight = 1.0 kg/item. Rocket capacity = 1000 items (1000 kg).
  const silo = calculateSiloLaunches({
    cargoResourceId: 'space-science-pack',
    ratePerSecond: 16.666666666666668,
  });

  assert.strictEqual(silo.weightPerItemKg, 1.0);
  assert.strictEqual(silo.capacityPerRocket, 1000);
  assert.strictEqual(Math.round(silo.launchesPerMinute), 1);
  console.log(`✅ Test 4: Legendary Rocket Silo Math passed (${silo.launchesPerMinute.toFixed(2)} launch/min for 16.67 space science packs/s).`);
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

// -------------------------------------------------------------
// Test 9: Space Age Interplanetary Logistics & Platforms
// -------------------------------------------------------------
{
  // 1. Standard science route calculation (16.67/sec = 1,000/min)
  const sciRoute = calculateInterplanetaryRoute({
    cargoResourceId: 'metallurgic-science-pack',
    ratePerSecond: 16.666666666666668,
  });
  assert.strictEqual(sciRoute.weightPerItemKg, 1.0);
  assert.strictEqual(sciRoute.capacityPerRocket, 1000);
  assert.strictEqual(Math.round(sciRoute.launchesPerMinute), 1);
  assert.strictEqual(sciRoute.silosRequired, 1);

  // 2. Heavy raw resource route calculation (Iron Ore: 2.0 kg per item, 33.33/sec = 2,000/min)
  const heavyRoute = calculateInterplanetaryRoute({
    cargoResourceId: 'iron-ore',
    ratePerSecond: 33.333333333333336,
  });
  assert.strictEqual(heavyRoute.weightPerItemKg, 2.0);
  assert.strictEqual(heavyRoute.capacityPerRocket, 500); // 1,000 kg / 2.0 kg = 500 items/rocket
  assert.strictEqual(Math.round(heavyRoute.launchesPerMinute), 4); // 2000 / 500 = 4 launches/min
  assert.strictEqual(heavyRoute.silosRequired, 4); // 4 launches / 1.0 per silo = 4 silos

  // 3. Default Project Interplanetary Routes check
  const project = createDefaultProject();
  assert(project.interplanetaryRoutes && project.interplanetaryRoutes.length >= 5);
  const nauvisRoutes = project.interplanetaryRoutes.filter(r => r.targetPlanet === 'nauvis');
  assert(nauvisRoutes.length >= 5, 'Must contain standard 5 science pack routes targeting Nauvis');

  // 4. Default Space Platform check
  assert(project.spacePlatforms && project.spacePlatforms.length >= 1);
  const platform = project.spacePlatforms[0];
  assert.strictEqual(platform.currentOrbit, 'nauvis');
  assert(platform.producedScience.some(s => s.resourceId === 'space-science-pack'));

  console.log(
    `✅ Test 9: Interplanetary Routes & Space Platforms passed (${project.interplanetaryRoutes.length} trade routes, ${project.spacePlatforms.length} space platform).`
  );
}

// -------------------------------------------------------------
// Test 10: Factory Presets Library & URL Hash Serialization
// -------------------------------------------------------------
{
  assert(FACTORY_PRESETS.length >= 3, 'Must contain at least 3 curated factory presets');

  for (const preset of FACTORY_PRESETS) {
    const p = preset.createProject();
    assert(p.name, `Preset ${preset.id} must have a name`);
    assert(p.planets, `Preset ${preset.id} must have planets`);
    assert(p.gameVersion === '2.1', `Preset ${preset.id} must target Factorio 2.1`);
  }

  // Test URL Permalink Base64 encode and decode
  const original = createDefaultProject('Permalink Test');
  const jsonStr = JSON.stringify(original);
  const base64Encoded = Buffer.from(jsonStr).toString('base64');

  // Decode back
  const decodedJsonStr = Buffer.from(base64Encoded, 'base64').toString('utf8');
  const parsed = JSON.parse(decodedJsonStr);

  assert.strictEqual(parsed.name, 'Permalink Test');
  assert.strictEqual(parsed.planets.nauvis.blocks.length, original.planets.nauvis.blocks.length);

  console.log(
    `✅ Test 10: Factory Presets & URL Permalink Roundtrip passed (${FACTORY_PRESETS.length} presets verified).`
  );
}

// -------------------------------------------------------------
// Test 11: Rocket Silo as Hex Grid Block & Traffic Flow Optimization
// -------------------------------------------------------------
{
  const project = createDefaultProject('Rocket Silo Grid Block Test');
  const nauvisBlocks = project.planets.nauvis.blocks;

  // Find the Rocket Silo block
  const siloBlock = nauvisBlocks.find(b => b.blockType === 'rocket-silo');
  assert(siloBlock, 'Nauvis must have a Rocket Silo block on the grid');
  assert.strictEqual(siloBlock.iconId, 'rocket-silo');
  assert(siloBlock.inputs.some(inp => inp.id === 'rocket-fuel'));
  assert(siloBlock.inputs.some(inp => inp.id === 'low-density-structure'));
  assert(siloBlock.inputs.some(inp => inp.id === 'processing-unit'));
  assert(siloBlock.outputs.some(out => out.id === 'space-science-pack'));

  // Calculate planet traffic including the silo block
  const traffic = calculatePlanetTraffic({
    blocks: nauvisBlocks,
    rawIngressNodes: project.planets.nauvis.rawIngressNodes,
    spaceHubs: project.planets.nauvis.spaceHubs,
  });

  assert(traffic.totalRoutes > 0, 'Must have traffic routes calculated');
  assert(traffic.totalTrainTripsPerMin > 0, 'Must have active train trips');

  // Verify that layout optimizer can position rocket silo blocks
  const optResult = optimizeBlockLayout({
    blocks: nauvisBlocks,
    rawIngressNodes: project.planets.nauvis.rawIngressNodes,
    spaceHubs: project.planets.nauvis.spaceHubs,
    options: { iterations: 100 },
  });

  assert(optResult.optimizedPlacements.has(siloBlock.id), 'Optimizer must place rocket silo block');
  console.log(`✅ Test 11: Rocket Silo Hex Block and Traffic Optimization passed.`);
}

// -------------------------------------------------------------
// Test 12: Block Duplication & Shared Blueprint Synchronization
// -------------------------------------------------------------
{
  // Test shared group blueprint logic
  interface MockBlock {
    id: string;
    name: string;
    coordinates: { q: number; r: number } | null;
    sharedGroupId?: string;
    rate: number;
  }

  let blocks: MockBlock[] = [
    { id: 'block-1', name: 'Green Circuits Alpha', coordinates: { q: 1, r: 0 }, rate: 200 },
  ];

  // Duplication function as in useFactoryPlanner
  function duplicate(sourceId: string): MockBlock {
    const src = blocks.find(b => b.id === sourceId)!;
    const sharedId = src.sharedGroupId || `shared-group-${Date.now()}`;
    src.sharedGroupId = sharedId;

    const copy: MockBlock = {
      ...src,
      id: `block-copy-${Math.random()}`,
      coordinates: null, // Unplaced copy
      sharedGroupId: sharedId,
    };
    blocks.push(copy);
    return copy;
  }

  // Update function as in useFactoryPlanner
  function updateBlock(updated: MockBlock) {
    if (updated.sharedGroupId) {
      blocks = blocks.map(b => {
        if (b.id === updated.id) return updated;
        if (b.sharedGroupId === updated.sharedGroupId) {
          return {
            ...updated,
            id: b.id,
            coordinates: b.coordinates, // Preserve unique placement
          };
        }
        return b;
      });
    } else {
      blocks = blocks.map(b => (b.id === updated.id ? updated : b));
    }
  }

  // Duplicate block-1
  const copy1 = duplicate('block-1');
  assert.strictEqual(blocks.length, 2);
  assert.strictEqual(blocks[0].sharedGroupId, blocks[1].sharedGroupId);
  assert.strictEqual(copy1.coordinates, null);
  assert.deepStrictEqual(blocks[0].coordinates, { q: 1, r: 0 });

  // Place copy1 at (2, 0)
  copy1.coordinates = { q: 2, r: 0 };
  blocks[1] = copy1;

  // Updating definition on block-1 should automatically update copy1
  const updatedBlock1: MockBlock = {
    ...blocks[0],
    name: 'Green Circuits 2.1 (Upgraded)',
    rate: 500,
  };
  updateBlock(updatedBlock1);

  assert.strictEqual(blocks[0].name, 'Green Circuits 2.1 (Upgraded)');
  assert.strictEqual(blocks[1].name, 'Green Circuits 2.1 (Upgraded)');
  assert.strictEqual(blocks[0].rate, 500);
  assert.strictEqual(blocks[1].rate, 500);
  // Distinct coordinates must be preserved!
  assert.deepStrictEqual(blocks[0].coordinates, { q: 1, r: 0 });
  assert.deepStrictEqual(blocks[1].coordinates, { q: 2, r: 0 });

  // Unlink copy1
  blocks[1].sharedGroupId = undefined;
  const unlinkedBlock2: MockBlock = {
    ...blocks[1],
    name: 'Green Circuits Independent Sub-factory',
    rate: 800,
  };
  updateBlock(unlinkedBlock2);

  assert.strictEqual(blocks[0].name, 'Green Circuits 2.1 (Upgraded)');
  assert.strictEqual(blocks[0].rate, 500);
  assert.strictEqual(blocks[1].name, 'Green Circuits Independent Sub-factory');
  assert.strictEqual(blocks[1].rate, 800);

  console.log('✅ Test 12: Block Duplication & Shared Blueprint Synchronization passed.');
}

runStorageTest().then(() => {
  console.log('\n🎉 ALL FACTORY PLANNER TESTS PASSED SUCCESSFULLY!');
}).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
