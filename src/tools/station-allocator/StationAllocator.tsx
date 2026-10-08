import React, { useState, useMemo } from 'react';
import { 
  Train, 
  Layers, 
  Sliders, 
  RotateCcw,
  Sparkles,
  ArrowRightLeft
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

export const StationAllocator: React.FC = () => {
  // Config state initialized with default Electronic Circuit / Processing unit setup
  const [config, setConfig] = useState<CityBlockConfig>(DEFAULT_PRESETS[0]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

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

        <div className="flex items-center gap-2">
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
