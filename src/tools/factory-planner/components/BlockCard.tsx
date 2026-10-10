import React from 'react';
import {
  Train,
  Layers,
  MapPin,
  Edit3,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Link2,
  Rocket,
  Box,
  AlertTriangle,
} from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import type { HexBlock } from '../types';
import type { ResourceBalanceItem } from '../core/resource-balance';

interface BlockCardProps {
  block: HexBlock;
  onEdit: (block: HexBlock) => void;
  onDelete: (blockId: string) => void;
  onDuplicate?: (blockId: string) => void;
  deficitMap?: Map<string, ResourceBalanceItem>;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  onEdit,
  onDelete,
  onDuplicate,
  deficitMap,
}) => {
  const totalInputTrains = block.inputs.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalOutputTrains = block.outputs.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalTrains = totalInputTrains + totalOutputTrains;

  const totalInputBays = block.inputs.reduce((sum, f) => sum + f.allocatedBays, 0);
  const totalOutputBays = block.outputs.reduce((sum, f) => sum + f.allocatedBays, 0);
  const totalBays = totalInputBays + totalOutputBays;

  const inputDeficits = block.inputs.filter((inp) => deficitMap?.has(inp.id));
  const hasDeficits = inputDeficits.length > 0;

  const borderColor = block.color || (block.blockType === 'rocket-silo' ? '#a855f7' : '#f97316');

  const handleOpenInAllocator = () => {
    const totalBays =
      block.inputs.reduce((sum, f) => sum + f.allocatedBays, 0) || Math.max(4, block.inputs.length);
    const cfg = {
      name: `${block.name} (City Block)`,
      blueprintMultiplier: block.blueprintMultiplier || 1,
      totalStations: totalBays,
      trainWagons: block.inputs[0]?.wagonCount || 2,
      isLegendaryQuality: block.inputs[0]?.isLegendary || false,
      beltStackLevel: 4,
      allocationMode: 'train-throughput' as const,
      entries: block.inputs.map((inp) => ({
        id: inp.id,
        name: inp.name,
        isFluid: inp.isFluid,
        inputRate: inp.ratePerSecond,
        unit: 'per-sec' as const,
        beltType: 'turbo' as const,
        lockStations: inp.allocatedBays || null,
      })),
    };
    const sharedPayload = {
      sourceBlock: {
        planetId: block.planetId,
        blockId: block.id,
        blockName: block.name,
      },
      config: cfg,
    };
    try {
      window.localStorage.setItem('factorio_shared_block_for_allocator', JSON.stringify(sharedPayload));
      window.dispatchEvent(new CustomEvent('switch-tool', { detail: { toolId: 'station-allocator' } }));
    } catch (e) {
      console.error('Failed to link to station allocator', e);
    }
  };

  return (
    <div
      className={`bg-zinc-900/80 border hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden ${
        hasDeficits ? 'border-red-900/50' : 'border-zinc-800'
      }`}
      style={{ borderLeftColor: borderColor, borderLeftWidth: 4 }}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-zinc-950 rounded-lg border border-zinc-800">
              <FactorioIcon id={block.iconId} size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-zinc-100 text-sm leading-tight group-hover:text-orange-400 transition">
                  {block.name}
                </h4>
                {block.blockType === 'rocket-silo' && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-800">
                    <Rocket className="w-2.5 h-2.5" />
                    Silo
                  </span>
                )}
                {block.blockType === 'cargo-landing-pad' && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                    <Box className="w-2.5 h-2.5" />
                    Cargo Pad
                  </span>
                )}
                {hasDeficits && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-300 bg-red-950/70 px-1.5 py-0.2 rounded border border-red-800/70"
                    title={`${inputDeficits.length} input resource(s) have an active production shortfall on this planet`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                    {inputDeficits.length} Shortfall{inputDeficits.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {block.coordinates ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/80">
                    <MapPin className="w-3 h-3 text-orange-400" />
                    Hex ({block.coordinates.q}, {block.coordinates.r})
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 bg-zinc-950/60 px-1.5 py-0.5 rounded">
                    Unplaced
                  </span>
                )}

                {block.sharedGroupId && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-300 bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/40"
                    title="Shared blueprint - linked across duplicate blocks on this world"
                  >
                    <Link2 className="w-2.5 h-2.5 text-purple-400" />
                    Shared
                  </span>
                )}

                {block.blueprintMultiplier > 1 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-300 bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/40">
                    <Layers className="w-3 h-3" />
                    {block.blueprintMultiplier}x copies
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
            {onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(block.id)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 transition cursor-pointer"
                title="Duplicate block (creates shared linked copy)"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenInAllocator}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition cursor-pointer"
              title="Analyze Station Bays in Train Allocator"
            >
              <Train className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(block)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
              title="Edit Block"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${block.name}"?`)) {
                  onDelete(block.id);
                }
              }}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
              title="Delete Block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Outputs (Production) Preview */}
        {block.outputs.length > 0 && (
          <div className="mb-2.5 bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/60">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>Outputs ({block.outputs.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {block.outputs.map((out) => {
                const deficit = deficitMap?.get(out.id);
                return (
                  <div
                    key={out.id}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs ${
                      deficit
                        ? 'bg-amber-950/30 border-amber-800/60'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                    title={
                      deficit
                        ? `World Demand Exceeds Supply! World needs +${deficit.deficitRate}/s more`
                        : undefined
                    }
                  >
                    <FactorioIcon id={out.id} size={16} />
                    <span className="font-mono text-zinc-300">
                      {out.ratePerSecond >= 1000
                        ? `${(out.ratePerSecond / 1000).toFixed(1)}k`
                        : out.ratePerSecond}
                      /s
                    </span>
                    <span className="text-[10px] text-orange-400/90 font-mono">
                      ({out.trainsPerMinute.toFixed(1)} tr/m)
                    </span>
                    {deficit && (
                      <span className="text-[9px] font-bold text-amber-400 ml-0.5">
                        (+{deficit.deficitRate}/s needed)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inputs (Consumption) Preview */}
        {block.inputs.length > 0 && (
          <div className="mb-3 bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/60">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
              <ArrowDownRight className="w-3 h-3" />
              <span>Inputs ({block.inputs.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {block.inputs.map((inp) => {
                const deficit = deficitMap?.get(inp.id);
                return (
                  <div
                    key={inp.id}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs ${
                      deficit
                        ? 'bg-red-950/40 border-red-800/80 text-red-200'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                    title={
                      deficit
                        ? `PLANETARY SHORTFALL: Only ${deficit.satisfactionPercent}% satisfied (-${deficit.deficitRate}/s)`
                        : undefined
                    }
                  >
                    <FactorioIcon id={inp.id} size={16} />
                    <span className="font-mono text-zinc-300">
                      {inp.ratePerSecond >= 1000
                        ? `${(inp.ratePerSecond / 1000).toFixed(1)}k`
                        : inp.ratePerSecond}
                      /s
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ({inp.trainsPerMinute.toFixed(1)} tr/m)
                    </span>
                    {deficit && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 ml-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        -{deficit.deficitRate}/s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="pt-2.5 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Train className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-mono text-zinc-200 font-semibold">
            {totalTrains.toFixed(2)}
          </span>
          <span className="text-zinc-500">trains/m</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-500">
          <span>{totalBays} Bays</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => onEdit(block)}
            className="text-orange-400 hover:text-orange-300 text-xs font-medium cursor-pointer"
          >
            Configure →
          </button>
        </div>
      </div>
    </div>
  );
};
