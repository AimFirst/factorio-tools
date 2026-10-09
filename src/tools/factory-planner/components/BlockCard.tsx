import React from 'react';
import { Train, Layers, MapPin, Edit3, Trash2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import type { HexBlock } from '../types';

interface BlockCardProps {
  block: HexBlock;
  onEdit: (block: HexBlock) => void;
  onDelete: (blockId: string) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  onEdit,
  onDelete,
}) => {
  const totalInputTrains = block.inputs.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalOutputTrains = block.outputs.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalTrains = totalInputTrains + totalOutputTrains;

  const totalInputBays = block.inputs.reduce((sum, f) => sum + f.allocatedBays, 0);
  const totalOutputBays = block.outputs.reduce((sum, f) => sum + f.allocatedBays, 0);
  const totalBays = totalInputBays + totalOutputBays;

  const borderColor = block.color || '#f97316';

  return (
    <div
      className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden"
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
              <h4 className="font-semibold text-zinc-100 text-sm leading-tight group-hover:text-orange-400 transition">
                {block.name}
              </h4>
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
              {block.outputs.map((out) => (
                <div
                  key={out.id}
                  className="flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-xs"
                >
                  <FactorioIcon id={out.id} size={16} />
                  <span className="font-mono text-zinc-300">
                    {out.ratePerMinute >= 1000
                      ? `${(out.ratePerMinute / 1000).toFixed(1)}k`
                      : out.ratePerMinute}
                    /m
                  </span>
                  <span className="text-[10px] text-orange-400/90 font-mono">
                    ({out.trainsPerMinute.toFixed(1)} tr/m)
                  </span>
                </div>
              ))}
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
              {block.inputs.map((inp) => (
                <div
                  key={inp.id}
                  className="flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-xs"
                >
                  <FactorioIcon id={inp.id} size={16} />
                  <span className="font-mono text-zinc-300">
                    {inp.ratePerMinute >= 1000
                      ? `${(inp.ratePerMinute / 1000).toFixed(1)}k`
                      : inp.ratePerMinute}
                    /m
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ({inp.trainsPerMinute.toFixed(1)} tr/m)
                  </span>
                </div>
              ))}
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
