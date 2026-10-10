import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Scale,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import type { PlanetaryResourceBalanceReport } from '../core/resource-balance.ts';
import type { SolidPlanetId, HexBlock } from '../types.ts';

interface ResourceBalanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: PlanetaryResourceBalanceReport;
  planetId: SolidPlanetId;
  blocks: HexBlock[];
  onSelectBlock: (block: HexBlock) => void;
  onAddNewBlockWithOutput?: (resourceId: string, resourceName: string) => void;
}

export const ResourceBalanceDrawer: React.FC<ResourceBalanceDrawerProps> = ({
  isOpen,
  onClose,
  report,
  planetId,
  blocks,
  onSelectBlock,
  onAddNewBlockWithOutput,
}) => {
  const [filter, setFilter] = useState<'all' | 'deficits' | 'surpluses'>('all');
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems =
    filter === 'deficits'
      ? report.deficits
      : filter === 'surpluses'
      ? report.surpluses
      : report.items;

  const toggleExpand = (resId: string) => {
    setExpandedResource((prev) => (prev === resId ? null : resId));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-zinc-950 border-l border-zinc-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/60 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-orange-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                  Planetary Resource Balance
                  {report.hasDeficits ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800/60 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      {report.totalDeficitCount} Deficit{report.totalDeficitCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Balanced
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-400 capitalize mt-0.5">
                  {planetId} World • Scaled by blueprint copies across all blocks
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              filter === 'all'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Resources ({report.items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('deficits')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              filter === 'deficits'
                ? 'bg-red-950/80 text-red-200 border border-red-800/60 font-semibold'
                : 'text-zinc-400 hover:text-red-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Deficits ({report.deficits.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('surpluses')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              filter === 'surpluses'
                ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/60 font-semibold'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Surplus ({report.surpluses.length})
          </button>
        </div>

        {/* Resource Items List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No resources match the selected filter.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedResource === item.resourceId;
              const isDeficit = item.status === 'deficit';
              const isSurplus = item.status === 'surplus';

              return (
                <div
                  key={item.resourceId}
                  className={`bg-zinc-900/60 border rounded-xl overflow-hidden transition-all ${
                    isDeficit
                      ? 'border-red-900/60 shadow-lg shadow-red-950/20'
                      : isSurplus
                      ? 'border-zinc-800 hover:border-zinc-700'
                      : 'border-zinc-800'
                  }`}
                >
                  {/* Summary Bar */}
                  <div
                    className="p-4 flex flex-col gap-3 cursor-pointer select-none"
                    onClick={() => toggleExpand(item.resourceId)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Icon & Name */}
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                          <FactorioIcon id={item.resourceId} size={28} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                            {item.resourceName}
                            {item.isFluid && (
                              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/50 px-1 py-0.2 rounded border border-cyan-800/40">
                                Fluid
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3 text-xs mt-0.5">
                            <span className="text-zinc-400">
                              Supply: <strong className="text-emerald-400 font-mono">{item.totalSupply}/s</strong>
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">
                              Demand: <strong className="text-amber-400 font-mono">{item.totalDemand}/s</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Balance Pill & Accordion Toggle */}
                      <div className="flex items-center gap-3">
                        {isDeficit ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-950/80 text-red-300 border border-red-800/80 font-mono">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              -{item.deficitRate}/s
                            </span>
                            <div className="text-[10px] text-red-400/90 font-medium mt-0.5 font-mono">
                              {item.satisfactionPercent}% satisfied
                            </div>
                          </div>
                        ) : isSurplus ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-mono">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                              +{item.netBalance}/s
                            </span>
                            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                              Surplus capacity
                            </div>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300">
                            Balanced
                          </span>
                        )}

                        <button
                          type="button"
                          className="text-zinc-500 hover:text-zinc-300 p-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar: Satisfaction Rate */}
                    <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800 flex">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDeficit
                            ? 'bg-gradient-to-r from-red-600 to-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, item.satisfactionPercent)}%` }}
                      />
                    </div>

                    {/* Deficit Recommendation Callout */}
                    {isDeficit && (
                      <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-red-200">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            Shortfall of <strong>{item.deficitRate}/s</strong>.{' '}
                            {item.estimatedAdditionalMultiplier ? (
                              <span>
                                Needs approx <strong>+{item.estimatedAdditionalMultiplier}x more blueprint copies</strong>.
                              </span>
                            ) : (
                              <span>No block produces this resource on this world yet!</span>
                            )}
                          </span>
                        </div>

                        {/* Quick action button */}
                        {onAddNewBlockWithOutput && item.producers.length === 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddNewBlockWithOutput(item.resourceId, item.resourceName);
                            }}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-md text-[11px] font-semibold transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Create Block
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800/80 bg-zinc-950/60 p-4 space-y-4 text-xs">
                      {/* Producers List */}
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
                          <span>Producers & Supply Sources ({item.producers.length})</span>
                          <span className="font-mono text-zinc-400">Total: {item.totalSupply}/s</span>
                        </div>
                        {item.producers.length === 0 ? (
                          <div className="text-zinc-500 text-[11px] italic bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/60">
                            No active production blocks or outposts supply this resource on {planetId}.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {item.producers.map((p, idx) => {
                              const blockObj = blocks.find((b) => b.id === p.blockId);
                              return (
                                <div
                                  key={`${p.blockId}-${idx}`}
                                  className="flex items-center justify-between bg-zinc-900/80 p-2 rounded-lg border border-zinc-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-zinc-200">{p.blockName}</span>
                                    {p.multiplier > 1 && (
                                      <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1 py-0.2 rounded border border-purple-800/40">
                                        {p.multiplier}x copies
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-emerald-400">
                                      +{p.ratePerSecond}/s
                                    </span>
                                    {blockObj && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectBlock(blockObj);
                                          onClose();
                                        }}
                                        className="text-orange-400 hover:text-orange-300 underline text-[11px] cursor-pointer"
                                        title="Open block in editor"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Consumers List */}
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center justify-between">
                          <span>Consumers & Demand Sinks ({item.consumers.length})</span>
                          <span className="font-mono text-zinc-400">Total: {item.totalDemand}/s</span>
                        </div>
                        {item.consumers.length === 0 ? (
                          <div className="text-zinc-500 text-[11px] italic bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/60">
                            No active factory blocks consume this resource.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {item.consumers.map((c, idx) => {
                              const blockObj = blocks.find((b) => b.id === c.blockId);
                              return (
                                <div
                                  key={`${c.blockId}-${idx}`}
                                  className="flex items-center justify-between bg-zinc-900/80 p-2 rounded-lg border border-zinc-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-zinc-200">{c.blockName}</span>
                                    {c.multiplier > 1 && (
                                      <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1 py-0.2 rounded border border-purple-800/40">
                                        {c.multiplier}x copies
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-amber-400">
                                      -{c.ratePerSecond}/s
                                    </span>
                                    {blockObj && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectBlock(blockObj);
                                          onClose();
                                        }}
                                        className="text-orange-400 hover:text-orange-300 underline text-[11px] cursor-pointer"
                                        title="Open block in editor"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
