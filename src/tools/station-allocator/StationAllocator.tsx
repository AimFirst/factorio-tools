import React, { useState, useMemo, useEffect } from 'react';
import { 
  Train, 
  Layers, 
  Sliders, 
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  Check,
  Link,
  ArrowLeft
} from 'lucide-react';
import type { ResourceDemandEntry, CityBlockConfig } from './types';
import { allocateStations, type StationDemandInput } from '../../lib/apportionment';
import { calculateTrainCapacity } from '../../lib/factorio';
import { getEffectiveBeltSpeed } from '../../types';
import { ResourceSelector } from '../../components/factorio/ResourceSelector';
import { ResourceDemandTable } from './ResourceDemandTable';
import { StationBayVisualizer } from './StationBayVisualizer';
import { PresetManager, DEFAULT_PRESETS } from './PresetManager';
import type { FactorioItem, FactorioFluid } from '../../data/generated/types';
import { defaultStorage } from '../factory-planner/storage/LocalStorageAdapter';
import { updateFlowMetrics } from '../factory-planner/core/calculations';
import type { SolidPlanetId, HexBlock, BlockResourceFlow } from '../factory-planner/types';

interface LinkedBlockContext {
  planetId: SolidPlanetId;
  blockId: string;
  blockName: string;
}

export const StationAllocator: React.FC = () => {
  // Config state initialized with default Electronic Circuit / Processing unit setup
  const [config, setConfig] = useState<CityBlockConfig>(DEFAULT_PRESETS[0]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [linkedBlock, setLinkedBlock] = useState<LinkedBlockContext | null>(null);
  const [availableBlocks, setAvailableBlocks] = useState<
    { id: string; name: string; planetId: SolidPlanetId }[]
  >([]);

  // Load available blocks from current factory planner project for seamless selection
  useEffect(() => {
    defaultStorage.getOrCreateInitialProject().then((proj) => {
      const list: { id: string; name: string; planetId: SolidPlanetId }[] = [];
      for (const [planetId, planetData] of Object.entries(proj.planets)) {
        for (const b of planetData.blocks) {
          list.push({ id: b.id, name: b.name, planetId: planetId as SolidPlanetId });
        }
      }
      setAvailableBlocks(list);
    }).catch(console.error);
  }, []);

  // Check for block dispatched from Multi-World Factory Planner
  useEffect(() => {
    try {
      const shared = window.localStorage.getItem('factorio_shared_block_for_allocator');
      if (shared) {
        const parsed = JSON.parse(shared);
        if (parsed.sourceBlock && parsed.config) {
          setLinkedBlock(parsed.sourceBlock);
          setConfig(parsed.config);
        } else {
          setConfig(parsed as CityBlockConfig);
        }
        window.localStorage.removeItem('factorio_shared_block_for_allocator');
      }
    } catch (e) {
      console.error('Failed to parse shared block in allocator', e);
    }
  }, []);

  // Compute station demands
  const demandInputs: StationDemandInput[] = useMemo(() => {
    return config.entries.map((entry) => {
      const trainCap = calculateTrainCapacity({
        resourceId: entry.id,
        isFluid: entry.isFluid,
        wagonCount: config.trainWagons,
        isLegendaryQuality: config.isLegendaryQuality,
      });

      let ratePerSec = entry.inputRate || 0;
      if (entry.unit === 'per-min') {
        ratePerSec = entry.inputRate / 60;
      } else if (entry.unit === 'belts') {
        const beltSpeed = getEffectiveBeltSpeed(entry.beltType, config.beltStackLevel);
        ratePerSec = entry.inputRate * beltSpeed;
      }

      // Total consumption for N blueprint copies
      const totalRatePerSec = ratePerSec * config.blueprintMultiplier;

      return {
        id: entry.id,
        name: entry.name,
        isFluid: entry.isFluid,
        ratePerSec: totalRatePerSec,
        trainCapacity: trainCap.totalCapacity,
        lockStations: entry.lockStations,
        stackSize: trainCap.effectiveStackSize,
      };
    });
  }, [config]);

  // Run discrete apportionment math
  const apportionment = useMemo(() => {
    return allocateStations(
      demandInputs,
      config.totalStations,
      config.allocationMode
    );
  }, [demandInputs, config.totalStations, config.allocationMode]);

  // Handlers
  const handleUpdateEntry = (index: number, partial: Partial<ResourceDemandEntry>) => {
    const updated = [...config.entries];
    updated[index] = { ...updated[index], ...partial };
    setConfig({ ...config, entries: updated });
  };

  const handleRemoveEntry = (index: number) => {
    const updated = config.entries.filter((_, i) => i !== index);
    setConfig({ ...config, entries: updated });
  };

  const handleAddResource = (resource: FactorioItem | FactorioFluid) => {
    const newEntry: ResourceDemandEntry = {
      id: resource.id,
      name: resource.name,
      isFluid: resource.type === 'fluid',
      inputRate: 100, // sensible default
      unit: 'per-sec',
      beltType: 'turbo',
      lockStations: null,
    };
    setConfig({
      ...config,
      entries: [...config.entries, newEntry],
    });
  };

  const handleReset = () => {
    setConfig({
      ...DEFAULT_PRESETS[0],
      name: 'Custom City Block',
    });
  };

  const handleSelectBlockToLink = async (blockId: string) => {
    if (!blockId) {
      setLinkedBlock(null);
      return;
    }
    try {
      const proj = await defaultStorage.getOrCreateInitialProject();
      for (const [planetId, planetData] of Object.entries(proj.planets)) {
        const found = planetData.blocks.find((b: HexBlock) => b.id === blockId);
        if (found) {
          setLinkedBlock({
            planetId: planetId as SolidPlanetId,
            blockId: found.id,
            blockName: found.name,
          });
          const totalBays =
            found.inputs.reduce((sum: number, f: BlockResourceFlow) => sum + f.allocatedBays, 0) || Math.max(4, found.inputs.length);
          setConfig({
            name: `${found.name} (City Block)`,
            blueprintMultiplier: found.blueprintMultiplier || 1,
            totalStations: totalBays,
            trainWagons: found.inputs[0]?.wagonCount || 2,
            isLegendaryQuality: found.inputs[0]?.isLegendary || false,
            beltStackLevel: 4,
            allocationMode: 'train-throughput',
            entries: found.inputs.map((inp: BlockResourceFlow) => ({
              id: inp.id,
              name: inp.name,
              isFluid: inp.isFluid,
              inputRate: inp.ratePerSecond,
              unit: 'per-sec',
              beltType: 'turbo',
              lockStations: inp.allocatedBays || null,
            })),
          });
          break;
        }
      }
    } catch (e) {
      console.error('Failed to link block', e);
    }
  };

  const handleApplyToPlanner = async () => {
    if (!linkedBlock) return;
    try {
      const proj = await defaultStorage.getOrCreateInitialProject();
      const planetData = proj.planets[linkedBlock.planetId];
      if (!planetData) {
        console.warn('Planet data not found in project');
        return;
      }
      const targetIndex = planetData.blocks.findIndex((b: HexBlock) => b.id === linkedBlock.blockId);
      if (targetIndex === -1) {
        console.warn('Target block not found in project');
        return;
      }

      const block = { ...planetData.blocks[targetIndex] };
      block.blueprintMultiplier = config.blueprintMultiplier;

      // Update existing inputs based on allocator apportionment results & config entries
      const updatedInputs = block.inputs.map((inp: BlockResourceFlow) => {
        const entry = config.entries.find((e) => e.id === inp.id);
        const result = apportionment.allocations.find((r) => r.id === inp.id);

        // Respect overridden/locked stations, or computed apportionment
        const allocatedBays =
          entry?.lockStations ?? (result?.allocatedStations || inp.allocatedBays || 1);

        // Convert entry input rate if modified in allocator
        let ratePerSecond = inp.ratePerSecond;
        if (entry) {
          if (entry.unit === 'per-sec') {
            ratePerSecond = entry.inputRate;
          } else if (entry.unit === 'per-min') {
            ratePerSecond = Number((entry.inputRate / 60).toFixed(2));
          } else if (entry.unit === 'belts') {
            const beltSpeed = getEffectiveBeltSpeed(entry.beltType, config.beltStackLevel);
            ratePerSecond = Number((entry.inputRate * beltSpeed).toFixed(2));
          }
        }

        const wagonCount = config.trainWagons;
        const isLegendary = config.isLegendaryQuality;

        const metrics = updateFlowMetrics({
          id: inp.id,
          isFluid: inp.isFluid,
          ratePerSecond,
          wagonCount,
          isLegendary,
        });

        return {
          ...inp,
          ratePerSecond,
          wagonCount,
          isLegendary,
          allocatedBays,
          trainCapacity: metrics.trainCapacity,
          trainsPerMinute: metrics.trainsPerMinute,
        };
      });

      // Any new resources added inside the allocator:
      for (const entry of config.entries) {
        if (!updatedInputs.some((inp: BlockResourceFlow) => inp.id === entry.id)) {
          const result = apportionment.allocations.find((r) => r.id === entry.id);
          const allocatedBays = entry.lockStations ?? (result?.allocatedStations || 1);
          let ratePerSecond = entry.inputRate;
          if (entry.unit === 'per-min') {
            ratePerSecond = Number((entry.inputRate / 60).toFixed(2));
          } else if (entry.unit === 'belts') {
            const beltSpeed = getEffectiveBeltSpeed(entry.beltType, config.beltStackLevel);
            ratePerSecond = Number((entry.inputRate * beltSpeed).toFixed(2));
          }
          const metrics = updateFlowMetrics({
            id: entry.id,
            isFluid: entry.isFluid,
            ratePerSecond,
            wagonCount: config.trainWagons,
            isLegendary: config.isLegendaryQuality,
          });
          updatedInputs.push({
            id: entry.id,
            name: entry.name,
            isFluid: entry.isFluid,
            ratePerSecond,
            wagonCount: config.trainWagons,
            isLegendary: config.isLegendaryQuality,
            allocatedBays,
            trainCapacity: metrics.trainCapacity,
            trainsPerMinute: metrics.trainsPerMinute,
          });
        }
      }

      block.inputs = updatedInputs;
      planetData.blocks[targetIndex] = block;
      proj.planets[linkedBlock.planetId] = planetData;

      await defaultStorage.saveProject(proj);
      window.dispatchEvent(new CustomEvent('planner-refresh'));
      window.dispatchEvent(new CustomEvent('switch-tool', { detail: { toolId: 'factory-planner' } }));
    } catch (e) {
      console.error('Failed to sync allocator back to planner', e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Tool Introduction & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#14171d] border border-[#2d333f] shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                City Block Train Station Allocator
              </h1>
              <p className="text-xs text-slate-400">
                Optimize discrete train station dedicated bays for multi-blueprint city blocks
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableBlocks.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#1e222a] px-2.5 py-1.5 rounded-lg border border-[#2d333f]">
              <Link className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={linkedBlock?.blockId || ''}
                onChange={(e) => handleSelectBlockToLink(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                title="Link this station configuration to a city block in the Factory Planner"
              >
                <option value="" className="bg-[#1e222a] text-slate-400">
                  Select City Block to Link...
                </option>
                {availableBlocks.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1e222a] text-slate-200">
                    {b.name} ({b.planetId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <PresetManager
            currentConfig={config}
            onLoadConfig={(loaded) => setConfig(loaded)}
          />

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22262e] hover:bg-[#2d333f] border border-[#2d333f] text-slate-300 text-xs font-medium transition cursor-pointer"
            title="Reset to default template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* City Block Integrated Link Banner */}
      {linkedBlock && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-950/70 via-amber-950/40 to-[#14171d] border-2 border-orange-500/70 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-inner">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-orange-400">
                  Connected City Block
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 capitalize font-medium">
                  {linkedBlock.planetId} World
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {linkedBlock.blockName}
              </h2>
              <p className="text-xs text-zinc-400">
                Selecting {config.totalStations} bays or locking station bay counts will directly update this block in the Multi-World Planner.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleApplyToPlanner}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Apply to City Block & Return
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('switch-tool', { detail: { toolId: 'factory-planner' } })
                );
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700 transition cursor-pointer"
              title="Return to Factory Planner without applying changes"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return
            </button>
            <button
              onClick={() => setLinkedBlock(null)}
              className="px-2.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs border border-zinc-800 transition cursor-pointer"
              title="Unlink block"
            >
              Unlink
            </button>
          </div>
        </div>
      )}

      {/* Global City Block Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Stations */}
        <div className="p-3.5 rounded-xl bg-[#14171d] border border-[#2d333f] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Train className="w-3.5 h-3.5 text-amber-500" />
              Unloading Stations
            </span>
            <span className="font-mono text-amber-400 font-bold">{config.totalStations}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[4, 6, 8, 12, 16].map((num) => (
              <button
                key={num}
                onClick={() => setConfig({ ...config, totalStations: num })}
                className={`flex-1 py-1 text-xs rounded font-mono font-medium transition cursor-pointer ${
                  config.totalStations === num
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#1e222a] text-slate-300 hover:bg-[#282d38]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Blueprint Copies Multiplier */}
        <div className="p-3.5 rounded-xl bg-[#14171d] border border-[#2d333f] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Blueprint Copies
            </span>
            <span className="font-mono text-amber-400 font-bold">{config.blueprintMultiplier}x</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 4, 8, 16].map((mult) => (
              <button
                key={mult}
                onClick={() => setConfig({ ...config, blueprintMultiplier: mult })}
                className={`flex-1 py-1 text-xs rounded font-mono font-medium transition cursor-pointer ${
                  config.blueprintMultiplier === mult
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#1e222a] text-slate-300 hover:bg-[#282d38]'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        {/* Train Composition (Wagons) */}
        <div className="p-3.5 rounded-xl bg-[#14171d] border border-[#2d333f] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              Train Config
            </span>
            <span className="font-mono text-slate-200">1-{config.trainWagons}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[2, 3, 4, 8].map((w) => (
              <button
                key={w}
                onClick={() => setConfig({ ...config, trainWagons: w })}
                className={`flex-1 py-1 text-xs rounded font-mono font-medium transition cursor-pointer ${
                  config.trainWagons === w
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#1e222a] text-slate-300 hover:bg-[#282d38]'
                }`}
              >
                1-{w}
              </button>
            ))}
          </div>
        </div>

        {/* Belt Stacking Level */}
        <div className="p-3.5 rounded-xl bg-[#14171d] border border-[#2d333f] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              Belt Stacking
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {config.beltStackLevel}x ({getEffectiveBeltSpeed('turbo', config.beltStackLevel)}/s)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {([1, 2, 3, 4] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setConfig({ ...config, beltStackLevel: lvl })}
                className={`flex-1 py-1 text-xs rounded font-mono font-medium transition cursor-pointer ${
                  config.beltStackLevel === lvl
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-[#1e222a] text-slate-300 hover:bg-[#282d38]'
                }`}
                title={`Level ${lvl} stacking (${getEffectiveBeltSpeed('turbo', lvl)} items/s on green belt)`}
              >
                {lvl}x
              </button>
            ))}
          </div>
        </div>

        {/* Quality & Allocation Engine Mode */}
        <div className="p-3.5 rounded-xl bg-[#14171d] border border-[#2d333f] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quality
            </span>
            <button
              onClick={() =>
                setConfig({ ...config, isLegendaryQuality: !config.isLegendaryQuality })
              }
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                config.isLegendaryQuality
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {config.isLegendaryQuality ? 'LEGENDARY (2.5x)' : 'NORMAL (1.0x)'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#2d333f]/60">
            <span>Mode:</span>
            <button
              onClick={() =>
                setConfig({
                  ...config,
                  allocationMode:
                    config.allocationMode === 'train-throughput'
                      ? 'raw-rate'
                      : 'train-throughput',
                })
              }
              className="text-[11px] font-mono text-slate-300 hover:text-amber-400 underline underline-offset-2 cursor-pointer"
            >
              {config.allocationMode === 'train-throughput' ? 'Train Demand' : 'Raw Rate'}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Station Bays Diagram */}
      <StationBayVisualizer
        result={apportionment}
        blueprintMultiplier={config.blueprintMultiplier}
        beltStackLevel={config.beltStackLevel}
      />

      {/* Resource Demand Table */}
      <ResourceDemandTable
        entries={config.entries}
        blueprintMultiplier={config.blueprintMultiplier}
        trainWagons={config.trainWagons}
        isLegendaryQuality={config.isLegendaryQuality}
        beltStackLevel={config.beltStackLevel}
        apportionment={apportionment}
        onUpdateEntry={handleUpdateEntry}
        onRemoveEntry={handleRemoveEntry}
        onOpenSelector={() => setIsSelectorOpen(true)}
      />

      {/* Resource Picker Modal */}
      <ResourceSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleAddResource}
        selectedIds={config.entries.map((e) => e.id)}
      />
    </div>
  );
};
