import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import https from 'node:https';

const DEFAULT_FACTORIO_PATHS = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Factorio',
  'C:\\Program Files\\Steam\\steamapps\\common\\Factorio',
  'D:\\SteamLibrary\\steamapps\\common\\Factorio',
  'E:\\SteamLibrary\\steamapps\\common\\Factorio',
  'F:\\SteamLibrary\\steamapps\\common\\Factorio',
];

function findFactorioPath() {
  if (process.env.FACTORIO_PATH && fs.existsSync(process.env.FACTORIO_PATH)) {
    return process.env.FACTORIO_PATH;
  }
  for (const p of DEFAULT_FACTORIO_PATHS) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'bin', 'x64', 'factorio.exe'))) {
      return p;
    }
  }
  return null;
}

function fetchLatestReleases() {
  return new Promise((resolve) => {
    https.get('https://factorio.com/api/latest-releases', { headers: { 'User-Agent': 'Factorio-Tools-Sync/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  console.log('🔍 Locating Factorio installation...');
  const factorioDir = findFactorioPath();
  if (!factorioDir) {
    console.error('❌ Factorio installation not found in standard paths.');
    console.error('Set the FACTORIO_PATH environment variable to your Factorio root folder.');
    process.exit(1);
  }
  console.log(`✅ Found Factorio at: ${factorioDir}`);

  // Check version from data/base/info.json
  const baseInfoPath = path.join(factorioDir, 'data', 'base', 'info.json');
  let installedVersion = 'unknown';
  if (fs.existsSync(baseInfoPath)) {
    const baseInfo = JSON.parse(fs.readFileSync(baseInfoPath, 'utf8'));
    installedVersion = baseInfo.version;
  }
  console.log(`📦 Installed Factorio Version: ${installedVersion}`);

  // Fetch online release info (best effort)
  console.log('🌐 Checking official Factorio release API...');
  const releaseInfo = await fetchLatestReleases();
  const latestStable = releaseInfo?.stable?.expansion || releaseInfo?.stable?.core || 'unknown';
  const latestExp = releaseInfo?.experimental?.expansion || releaseInfo?.experimental?.core || 'unknown';
  console.log(`🌐 Online Releases: Stable=${latestStable}, Experimental=${latestExp}`);

  // Create isolated temp directory for safe dumping without locking/conflicting
  const tempDir = path.resolve('.temp_factorio_sync');
  const tempScriptOutputDir = path.join(tempDir, 'script-output');
  fs.mkdirSync(tempScriptOutputDir, { recursive: true });

  const tempConfigPath = path.resolve('.temp_factorio_sync_config.ini');
  const tempConfigContent = `[path]\nread-data=${path.join(factorioDir, 'data').replace(/\\/g, '/')}\nwrite-data=${tempDir.replace(/\\/g, '/')}\n`;
  fs.writeFileSync(tempConfigPath, tempConfigContent, 'utf8');

  const exePath = path.join(factorioDir, 'bin', 'x64', 'factorio.exe');

  try {
    console.log('⚡ Exporting prototypes (factorio --dump-data)...');
    execFileSync(exePath, ['-c', tempConfigPath, '--dump-data'], { stdio: 'ignore' });

    console.log('⚡ Exporting localized names (factorio --dump-prototype-locale)...');
    execFileSync(exePath, ['-c', tempConfigPath, '--dump-prototype-locale'], { stdio: 'ignore' });
  } catch (err) {
    console.error('❌ Failed running Factorio data dump:', err.message);
    cleanup(tempDir, tempConfigPath);
    process.exit(1);
  }

  const dumpFile = path.join(tempScriptOutputDir, 'data-raw-dump.json');
  const itemLocaleFile = path.join(tempScriptOutputDir, 'item-locale.json');
  const fluidLocaleFile = path.join(tempScriptOutputDir, 'fluid-locale.json');

  if (!fs.existsSync(dumpFile)) {
    console.error('❌ Expected dump file not found at:', dumpFile);
    cleanup(tempDir, tempConfigPath);
    process.exit(1);
  }

  console.log('📊 Processing prototype data...');
  const rawData = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));
  
  let itemLocale = {};
  if (fs.existsSync(itemLocaleFile)) {
    try {
      const loc = JSON.parse(fs.readFileSync(itemLocaleFile, 'utf8'));
      itemLocale = loc.names || {};
    } catch {
      // ignore
    }
  }

  let fluidLocale = {};
  if (fs.existsSync(fluidLocaleFile)) {
    try {
      const loc = JSON.parse(fs.readFileSync(fluidLocaleFile, 'utf8'));
      fluidLocale = loc.names || {};
    } catch {
      // ignore
    }
  }

  // Extract items
  const itemProtoTypes = [
    'item', 'ammo', 'capsule', 'gun', 'armor', 'module', 
    'tool', 'repair-tool', 'spidertron-remote', 'item-with-entity-data'
  ];

  const items = {};
  for (const protoType of itemProtoTypes) {
    const group = rawData[protoType] || {};
    for (const [id, item] of Object.entries(group)) {
      if (!id || items[id]) continue;
      // Filter out hidden or internal items without stack size
      if (!item.stack_size) continue;

      items[id] = {
        id,
        name: itemLocale[id] || formatName(id),
        type: 'item',
        protoType,
        stackSize: item.stack_size || 1,
        subgroup: item.subgroup || 'other',
        order: item.order || '',
        weight: item.weight || null,
      };
    }
  }

  // Extract fluids
  const fluids = {};
  const rawFluids = rawData.fluid || {};
  for (const [id, fluid] of Object.entries(rawFluids)) {
    if (!id) continue;
    fluids[id] = {
      id,
      name: fluidLocale[id] || formatName(id),
      type: 'fluid',
      protoType: 'fluid',
      stackSize: 0, // Fluids do not have stack size
      subgroup: fluid.subgroup || 'fluid',
      defaultTemperature: fluid.default_temperature ?? 15,
      maxTemperature: fluid.max_temperature ?? 100,
      fuelValue: fluid.fuel_value || null,
    };
  }

  // Extract Quality information
  const quality = {};
  const rawQuality = rawData.quality || {};
  for (const [id, q] of Object.entries(rawQuality)) {
    if (['quality-unknown'].includes(id)) continue;
    quality[id] = {
      id,
      name: formatName(id),
      level: q.level ?? 0,
      color: q.color || [255, 255, 255],
      cargoWagonInventoryMultiplier: q.cargo_wagon_inventory_size_multiplier ?? 1,
      rollingStockSpeedMultiplier: q.rolling_stock_max_speed_multiplier ?? 1,
      locomotivePowerMultiplier: q.locomotive_power_multiplier ?? 1,
    };
  }

  // Extract Rolling Stock stats
  const rollingStock = {
    cargoWagon: {
      baseInventorySize: rawData['cargo-wagon']?.['cargo-wagon']?.inventory_size ?? 40,
      legendaryInventorySize: Math.floor((rawData['cargo-wagon']?.['cargo-wagon']?.inventory_size ?? 40) * (quality.legendary?.cargoWagonInventoryMultiplier ?? 2.5)),
    },
    fluidWagon: {
      baseCapacity: rawData['fluid-wagon']?.['fluid-wagon']?.capacity ?? 50000,
      legendaryCapacity: rawData['fluid-wagon']?.['fluid-wagon']?.capacity ?? 50000, // Fluid capacity is fixed in vanilla Space Age
    },
    locomotive: {
      basePowerKw: 600,
      legendaryPowerKw: 1200,
    }
  };

  // Prepare output directory
  const outputDir = path.resolve('src/data/generated');
  fs.mkdirSync(outputDir, { recursive: true });

  const metadata = {
    gameVersion: installedVersion,
    extractedAt: new Date().toISOString(),
    latestOnlineStable: latestStable,
    latestOnlineExperimental: latestExp,
    isUpToDate: installedVersion === latestStable || installedVersion === latestExp,
    spaceAgeActive: fs.existsSync(path.join(factorioDir, 'data', 'space-age')),
    totalItems: Object.keys(items).length,
    totalFluids: Object.keys(fluids).length,
  };

  const bundle = {
    metadata,
    quality,
    rollingStock,
    items,
    fluids,
  };

  fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'factorio-data.json'), JSON.stringify(bundle, null, 2), 'utf8');

  // Generate TypeScript definitions
  const tsContent = `// Auto-generated by scripts/sync-factorio-data.mjs
export interface FactorioMetadata {
  gameVersion: string;
  extractedAt: string;
  latestOnlineStable: string;
  latestOnlineExperimental: string;
  isUpToDate: boolean;
  spaceAgeActive: boolean;
  totalItems: number;
  totalFluids: number;
}

export interface FactorioItem {
  id: string;
  name: string;
  type: 'item' | 'fluid';
  protoType: string;
  stackSize: number;
  subgroup: string;
  order: string;
  weight: number | null;
}

export interface FactorioFluid {
  id: string;
  name: string;
  type: 'fluid';
  protoType: 'fluid';
  stackSize: 0;
  subgroup: string;
  defaultTemperature: number;
  maxTemperature: number;
  fuelValue: string | null;
}

export interface FactorioQuality {
  id: string;
  name: string;
  level: number;
  color: number[];
  cargoWagonInventoryMultiplier: number;
  rollingStockSpeedMultiplier: number;
  locomotivePowerMultiplier: number;
}

export interface RollingStockConfig {
  cargoWagon: {
    baseInventorySize: number;
    legendaryInventorySize: number;
  };
  fluidWagon: {
    baseCapacity: number;
    legendaryCapacity: number;
  };
  locomotive: {
    basePowerKw: number;
    legendaryPowerKw: number;
  };
}

export interface FactorioDataBundle {
  metadata: FactorioMetadata;
  quality: Record<string, FactorioQuality>;
  rollingStock: RollingStockConfig;
  items: Record<string, FactorioItem>;
  fluids: Record<string, FactorioFluid>;
}
`;
  fs.writeFileSync(path.join(outputDir, 'types.ts'), tsContent, 'utf8');

  console.log(`✅ Extracted ${Object.keys(items).length} items and ${Object.keys(fluids).length} fluids.`);
  console.log(`💾 Saved to ${path.join(outputDir, 'factorio-data.json')}`);

  cleanup(tempDir, tempConfigPath);
}

function formatName(raw) {
  return raw
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function cleanup(dir, config) {
  try {
    if (fs.existsSync(config)) fs.unlinkSync(config);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn('⚠️ Could not remove temp files:', err.message);
  }
}

main().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
