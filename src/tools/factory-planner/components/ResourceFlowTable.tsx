import React, { useState } from 'react';
import { Plus, Trash2, Train, Sparkles, AlertCircle } from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import { ResourceSelector } from '../../../components/factorio/ResourceSelector';
import type { BlockResourceFlow } from '../types';
import { updateFlowMetrics } from '../core/calculations';
import type { FactorioItem, FactorioFluid } from '../../../data/generated/types';

interface ResourceFlowTableProps {
  title: string;
  type: 'input' | 'output';
  flows: BlockResourceFlow[];
  onChange: (flows: BlockResourceFlow[]) => void;
}

export const ResourceFlowTable: React.FC<ResourceFlowTableProps> = ({
  title,
  type,
  flows,
  onChange,
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false);

  const handleAddResource = (resource: FactorioItem | FactorioFluid) => {
    // Check if already in list
    if (flows.some((f) => f.id === resource.id)) {
      setSelectorOpen(false);
      return;
    }

    const isFluid = resource.type === 'fluid';
    const wagonCount = 2;
    const isLegendary = false;
    const ratePerMinute = isFluid ? 12000 : 6000;

    const metrics = updateFlowMetrics({
      id: resource.id,
      isFluid,
      ratePerMinute,
      wagonCount,
      isLegendary,
    });

    const newFlow: BlockResourceFlow = {
      id: resource.id,
      name: resource.name,
      isFluid,
      ratePerMinute,
      wagonCount,
      isLegendary,
      trainCapacity: metrics.trainCapacity,
      trainsPerMinute: metrics.trainsPerMinute,
      allocatedBays: 1,
    };

    onChange([...flows, newFlow]);
    setSelectorOpen(false);
  };

  const handleUpdateFlow = (index: number, partial: Partial<BlockResourceFlow>) => {
    const updated = flows.map((flow, i) => {
      if (i !== index) return flow;

      const merged = { ...flow, ...partial };
      const metrics = updateFlowMetrics({
        id: merged.id,
        isFluid: merged.isFluid,
        ratePerMinute: merged.ratePerMinute,
        wagonCount: merged.wagonCount,
        isLegendary: merged.isLegendary,
      });

      return {
        ...merged,
        trainCapacity: metrics.trainCapacity,
        trainsPerMinute: metrics.trainsPerMinute,
      };
    });

    onChange(updated);
  };

  const handleRemoveFlow = (index: number) => {
    onChange(flows.filter((_, i) => i !== index));
  };

  const totalTrainsPerMin = flows.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalBays = flows.reduce((sum, f) => sum + f.allocatedBays, 0);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Table Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              type === 'input' ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <h4 className="font-semibold text-zinc-100 text-sm tracking-wide">
            {title} ({flows.length})
          </h4>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800/80">
            <Train className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-mono text-zinc-200">
              {totalTrainsPerMin.toFixed(2)}
            </span>
            <span className="text-zinc-500">trains/m</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800/80">
            <span className="text-zinc-500">Bays:</span>
            <span className="font-mono text-zinc-200 font-semibold">{totalBays}</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-md border border-orange-500/30 text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add {type === 'input' ? 'Input' : 'Output'}
          </button>
        </div>
      </div>

      {/* Rows */}
      {flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-xs gap-1">
          <AlertCircle className="w-5 h-5 text-zinc-600 mb-1" />
          <span>No {type} resources configured for this block.</span>
          <span className="text-zinc-600">
            Click "Add {type === 'input' ? 'Input' : 'Output'}" to add items or fluids.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                <th className="py-2 px-2">Resource</th>
                <th className="py-2 px-2">Rate (/min)</th>
                <th className="py-2 px-2">Rate (/sec)</th>
                <th className="py-2 px-2">Wagons</th>
                <th className="py-2 px-2 text-center">Quality</th>
                <th className="py-2 px-2">Train Cap</th>
                <th className="py-2 px-2">Trains/min</th>
                <th className="py-2 px-2 text-center">Bays</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {flows.map((flow, index) => {
                const ratePerSec = flow.ratePerMinute / 60;
                return (
                  <tr key={flow.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Icon & Name */}
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <FactorioIcon id={flow.id} size={24} />
                        <div>
                          <div className="font-medium text-zinc-200">{flow.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {flow.isFluid ? 'Fluid' : 'Item'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rate per Min */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={flow.ratePerMinute}
                        onChange={(e) =>
                          handleUpdateFlow(index, {
                            ratePerMinute: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-24 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs focus:outline-none focus:border-orange-500"
                      />
                    </td>

                    {/* Rate per Sec */}
                    <td className="py-2 px-2 font-mono text-zinc-400">
                      {ratePerSec < 10
                        ? ratePerSec.toFixed(2)
                        : Math.round(ratePerSec).toLocaleString()}
                      /s
                    </td>

                    {/* Wagons */}
                    <td className="py-2 px-2">
                      <select
                        value={flow.wagonCount}
                        onChange={(e) =>
                          handleUpdateFlow(index, {
                            wagonCount: parseInt(e.target.value, 10),
                          })
                        }
                        className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-zinc-200 font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value={1}>1 wagon</option>
                        <option value={2}>2 wagons</option>
                        <option value={3}>3 wagons</option>
                        <option value={4}>4 wagons</option>
                        <option value={8}>8 wagons</option>
                      </select>
                    </td>

                    {/* Quality Toggle */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateFlow(index, {
                            isLegendary: !flow.isLegendary,
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer border ${
                          flow.isLegendary
                            ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Toggle Legendary Quality (+150% wagon & stack capacity)"
                      >
                        <Sparkles className="w-3 h-3" />
                        {flow.isLegendary ? 'Legendary' : 'Normal'}
                      </button>
                    </td>

                    {/* Train Capacity */}
                    <td className="py-2 px-2 font-mono text-zinc-300">
                      {flow.trainCapacity.toLocaleString()}
                    </td>

                    {/* Trains/min */}
                    <td className="py-2 px-2">
                      <span className="font-mono font-medium text-orange-400">
                        {flow.trainsPerMinute.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-500 ml-1">/m</span>
                    </td>

                    {/* Allocated Bays */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={flow.allocatedBays}
                        onChange={(e) =>
                          handleUpdateFlow(index, {
                            allocatedBays: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-12 text-center bg-zinc-950 border border-zinc-800 rounded px-1 py-1 text-zinc-200 font-mono text-xs focus:outline-none focus:border-orange-500"
                      />
                    </td>

                    {/* Delete */}
                    <td className="py-2 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveFlow(index)}
                        className="text-zinc-500 hover:text-red-400 transition p-1 cursor-pointer"
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

      {/* Resource Picker Modal */}
      <ResourceSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAddResource}
        selectedIds={flows.map((f) => f.id)}
      />
    </div>
  );
};
