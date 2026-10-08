import assert from 'node:assert';
import { allocateStations } from '../src/lib/apportionment.ts';
import { calculateTrainCapacity } from '../src/lib/factorio.ts';

console.log('🧪 Testing Factorio Station Allocator Engine...\n');

// Test 1: Train capacity calculation for Legendary Items vs Normal
{
  const normalIron = calculateTrainCapacity({
    resourceId: 'iron-plate',
    isFluid: false,
    wagonCount: 4,
    isLegendaryQuality: false,
  });
  // 4 wagons * 40 slots * 100 stack size = 16,000 iron plates
  assert.strictEqual(normalIron.slotsPerWagon, 40);
  assert.strictEqual(normalIron.effectiveStackSize, 100);
  assert.strictEqual(normalIron.totalCapacity, 16000);
  console.log('✅ Test 1: Normal Train Capacity calculation passed.');

  const legendaryIron = calculateTrainCapacity({
    resourceId: 'iron-plate',
    isFluid: false,
    wagonCount: 4,
    isLegendaryQuality: true,
  });
  // 4 wagons * 100 slots * 250 stack size = 100,000 iron plates
  assert.strictEqual(legendaryIron.slotsPerWagon, 100);
  assert.strictEqual(legendaryIron.effectiveStackSize, 250);
  assert.strictEqual(legendaryIron.totalCapacity, 100000);
  console.log('✅ Test 2: Legendary Train Capacity (2.5x wagon * 2.5x stack) passed.');
}

// Test 3: Fluid wagon capacity
{
  const fluid = calculateTrainCapacity({
    resourceId: 'sulfuric-acid',
    isFluid: true,
    wagonCount: 4,
    isLegendaryQuality: true,
  });
  // 4 fluid wagons * 50,000 = 200,000 fluid
  assert.strictEqual(fluid.totalCapacity, 200000);
  console.log('✅ Test 3: Fluid Wagon Capacity passed.');
}

// Test 4: 8-Station Discrete Apportionment
{
  const inputs = [
    {
      id: 'copper-cable',
      name: 'Copper Cable',
      isFluid: false,
      ratePerSec: 1000,
      trainCapacity: 100000,
    },
    {
      id: 'iron-plate',
      name: 'Iron Plate',
      isFluid: false,
      ratePerSec: 300,
      trainCapacity: 100000,
    },
    {
      id: 'plastic-bar',
      name: 'Plastic Bar',
      isFluid: false,
      ratePerSec: 100,
      trainCapacity: 100000,
    },
  ];

  const result = allocateStations(inputs, 8, 'train-throughput');
  assert.strictEqual(result.usedStations, 8);
  assert.strictEqual(result.isOverCapacity, false);

  const copper = result.allocations.find(a => a.id === 'copper-cable');
  const iron = result.allocations.find(a => a.id === 'iron-plate');
  const plastic = result.allocations.find(a => a.id === 'plastic-bar');

  assert(copper && copper.allocatedStations >= 4, `Copper should get >=4: got ${copper?.allocatedStations}`);
  assert(iron && iron.allocatedStations >= 2, `Iron should get >=2: got ${iron?.allocatedStations}`);
  assert(plastic && plastic.allocatedStations >= 1, `Plastic should get >=1: got ${plastic?.allocatedStations}`);
  assert.strictEqual(copper.allocatedStations + iron.allocatedStations + plastic.allocatedStations, 8);
  console.log(`✅ Test 4: 8-Station Discrete Apportionment passed (Allocations: Copper=${copper.allocatedStations}, Iron=${iron.allocatedStations}, Plastic=${plastic.allocatedStations}).`);
}

// Test 5: Manual station lock
{
  const inputs = [
    {
      id: 'copper-cable',
      name: 'Copper Cable',
      isFluid: false,
      ratePerSec: 1000,
      trainCapacity: 100000,
      lockStations: 2, // Manually pinned to 2
    },
    {
      id: 'iron-plate',
      name: 'Iron Plate',
      isFluid: false,
      ratePerSec: 300,
      trainCapacity: 100000,
    },
  ];

  const result = allocateStations(inputs, 8, 'train-throughput');
  const copper = result.allocations.find(a => a.id === 'copper-cable');
  const iron = result.allocations.find(a => a.id === 'iron-plate');

  assert.strictEqual(copper.allocatedStations, 2);
  assert.strictEqual(iron.allocatedStations, 6);
  assert.strictEqual(result.usedStations, 8);
  console.log('✅ Test 5: Manual station lock passed.');
}

console.log('\n🎉 ALL ALLOCATOR TESTS PASSED SUCCESSFULLY!');
