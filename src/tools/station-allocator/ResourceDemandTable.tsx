import React from 'react';
import { Plus, Trash2, Droplet, Box, Lock, Unlock } from 'lucide-react';
import type { ResourceDemandEntry, RateUnit } from './types';
import type { ApportionmentResult } from '../../lib/apportionment';
import { getItem, calculateTrainCapacity } from '../../lib/factorio';
import { getEffectiveBeltSpeed, type BeltType, type BeltStackLevel } from '../../types';

interface ResourceDemandTableProps {
  entries: ResourceDemandEntry[];
  blueprintMultiplier: number;
  trainWagons: number;
  isLegendaryQuality: boolean;
  beltStackLevel: BeltStackLevel;
  apportionment: ApportionmentResult;
  onUpdateEntry: (index: number, entry: Partial<ResourceDemandEntry>) => void;
  onRemoveEntry: (index: number) => void;
  onOpenSelector: () => void;
}

export const ResourceDemandTable: React.FC<ResourceDemandTableProps> = ({
  entries,
  blueprintMultiplier,
  trainWagons,
  isLegendaryQuality,
  beltStackLevel,
  apportionment,
  onUpdateEntry,
  onRemoveEntry,
  onOpenSelector,
}) => {
  return (
    <div className="rounded-xl bg-[#14171d] border border-[#2d333f] overflow-hidden shadow-lg">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-[#2d333f] bg-[#101216] gap-3">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm">
            Blueprint Input Requirements ({entries.length} Resources)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter consumption for <span className="text-amber-400 font-medium">1 single blueprint copy</span>. Total rates auto-scale by {blueprintMultiplier}x.
          </p>
        </div>

        <button
          onClick={onOpenSelector}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <p className="text-slate-400 text-sm mb-3">No input resources added yet.</p>
          <button
            onClick={onOpenSelector}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22262e] hover:bg-[#2d333f] border border-[#2d333f] text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            Pick an item or fluid to start
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2d333f] bg-[#0e1014] text-slate-400 font-medium">
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Stack / Capacity</th>
                <th className="py-3 px-4">Single Blueprint Rate</th>
                <th className="py-3 px-4">Total Demand ({blueprintMultiplier}x)</th>
                <th className="py-3 px-4">Train Capacity</th>
                <th className="py-3 px-4">Allocated Bays</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202530]">
              {entries.map((entry, index) => {
                const item = getItem(entry.id);
                const trainCap = calculateTrainCapacity({
                  resourceId: entry.id,
                  isFluid: entry.isFluid,
                  wagonCount: trainWagons,
                  isLegendaryQuality,
                });

                // Calculate rate per second
                let singleRatePerSec = entry.inputRate || 0;
                if (entry.unit === 'per-min') {
                  singleRatePerSec = entry.inputRate / 60;
                } else if (entry.unit === 'belts') {
                  const beltSpeed = getEffectiveBeltSpeed(entry.beltType, beltStackLevel);
                  singleRatePerSec = entry.inputRate * beltSpeed;
                }

                const totalRatePerSec = singleRatePerSec * blueprintMultiplier;

                // Lookup allocated result
                const alloc = apportionment.allocations.find((a) => a.id === entry.id);
                const allocatedCount = alloc?.allocatedStations || 0;

                return (
                  <tr key={entry.id} className="hover:bg-[#1a1e27] transition">
                    {/* Resource Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${
                            entry.isFluid
                              ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400'
                              : 'bg-amber-950/40 border-amber-800/40 text-amber-400'
                          }`}
                        >
                          {entry.isFluid ? (
                            <Droplet className="w-3.5 h-3.5" />
                          ) : (
                            <Box className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{entry.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {entry.isFluid ? 'Fluid' : 'Item'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stack / Capacity */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {entry.isFluid ? (
                        <div>
                          <span className="text-cyan-400">
                            {(trainCap.capacityPerWagon / 1000).toLocaleString()}k / wagon
                          </span>
                          {isLegendaryQuality && (
                            <span className="text-[10px] text-cyan-400/80 block">
                              (base: 50k)
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span>{trainCap.effectiveStackSize} / stack</span>
                          {isLegendaryQuality && (
                            <span className="text-[10px] text-amber-400/80 block">
                              (base: {item?.stackSize || 50})
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Single Blueprint Rate Input */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={entry.inputRate === 0 ? '' : entry.inputRate}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onUpdateEntry(index, { inputRate: val });
                          }}
                          className="w-24 px-2 py-1 bg-[#0e1014] border border-[#2d333f] focus:border-amber-500 focus:outline-none rounded text-slate-100 font-mono text-xs"
                        />

                        {/* Unit selector */}
                        <select
                          value={entry.unit}
                          onChange={(e) =>
                            onUpdateEntry(index, { unit: e.target.value as RateUnit })
                          }
                          className="px-2 py-1 bg-[#1a1e27] border border-[#2d333f] rounded text-slate-300 text-xs focus:outline-none"
                        >
                          <option value="per-sec">/ sec</option>
                          <option value="per-min">/ min</option>
                          {!entry.isFluid && <option value="belts">belts</option>}
                        </select>

                        {!entry.isFluid && entry.unit === 'belts' && (
                          <select
                            value={entry.beltType}
                            onChange={(e) =>
                              onUpdateEntry(index, { beltType: e.target.value as BeltType })
                            }
                            className="px-1.5 py-1 bg-[#1a1e27] border border-[#2d333f] rounded text-emerald-400 text-xs font-mono focus:outline-none"
                          >
                            <option value="turbo">
                              Green ({getEffectiveBeltSpeed('turbo', beltStackLevel)}/s{beltStackLevel > 1 ? ` • ${beltStackLevel}x stack` : ''})
                            </option>
                            <option value="express">
                              Blue ({getEffectiveBeltSpeed('express', beltStackLevel)}/s{beltStackLevel > 1 ? ` • ${beltStackLevel}x stack` : ''})
                            </option>
                            <option value="fast">
                              Red ({getEffectiveBeltSpeed('fast', beltStackLevel)}/s{beltStackLevel > 1 ? ` • ${beltStackLevel}x stack` : ''})
                            </option>
                            <option value="transport">
                              Yellow ({getEffectiveBeltSpeed('transport', beltStackLevel)}/s{beltStackLevel > 1 ? ` • ${beltStackLevel}x stack` : ''})
                            </option>
                          </select>
                        )}
                      </div>
                    </td>

                    {/* Total Demand */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-slate-200">
                        {totalRatePerSec < 10
                          ? totalRatePerSec.toFixed(2)
                          : Math.round(totalRatePerSec).toLocaleString()}{' '}
                        {entry.isFluid ? 'u/s' : 'it/s'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {Math.round(totalRatePerSec * 60).toLocaleString()} / min
                      </div>
                    </td>

                    {/* Train Capacity */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>
                        {trainCap.totalCapacity.toLocaleString()}{' '}
                        {entry.isFluid ? 'units' : 'items'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {trainWagons} wagons &bull;{' '}
                        {isLegendaryQuality ? '100 slots ea' : '40 slots ea'}
                      </div>
                    </td>

                    {/* Allocated Bays & Lock */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded font-mono font-semibold text-xs border ${
                            allocatedCount > 0
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {allocatedCount} {allocatedCount === 1 ? 'bay' : 'bays'}
                        </span>

                        {/* Station Lock Toggle */}
                        <button
                          title={
                            entry.lockStations
                              ? `Locked to ${entry.lockStations} stations. Click to unlock.`
                              : 'Click to lock station count'
                          }
                          onClick={() => {
                            if (entry.lockStations) {
                              onUpdateEntry(index, { lockStations: null });
                            } else {
                              onUpdateEntry(index, { lockStations: allocatedCount || 1 });
                            }
                          }}
                          className={`p-1 rounded border transition ${
                            entry.lockStations
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                              : 'border-[#2d333f] text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {entry.lockStations ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {entry.lockStations && (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={entry.lockStations}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              onUpdateEntry(index, { lockStations: val });
                            }}
                            className="w-12 px-1 py-0.5 bg-[#0e1014] border border-[#2d333f] text-slate-200 text-[11px] rounded font-mono"
                          />
                          <span className="text-[10px] text-amber-400 font-mono">locked</span>
                        </div>
                      )}
                    </td>

                    {/* Delete Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onRemoveEntry(index)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        title="Remove resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
