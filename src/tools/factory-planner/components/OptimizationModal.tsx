import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  TrendingDown,
  ArrowRight,
  Layers,
  Train,
  Loader2,
} from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import type { HexBlock, HexCoordinates, RawIngressNode, SpaceHubNode } from '../types.ts';
import { optimizeBlockLayout, type OptimizationResult } from '../core/optimizer.ts';

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (newPlacements: Map<string, HexCoordinates>) => void;
  blocks: HexBlock[];
  rawIngressNodes: RawIngressNode[];
  spaceHubs: SpaceHubNode[];
}

export const OptimizationModal: React.FC<OptimizationModalProps> = ({
  isOpen,
  onClose,
  onApply,
  blocks,
  rawIngressNodes,
  spaceHubs,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  if (!isOpen) return null;

  const handleRunOptimization = () => {
    setIsRunning(true);
    // Allow UI to render loading state before heavy solver loop
    setTimeout(() => {
      try {
        const res = optimizeBlockLayout({
          blocks,
          rawIngressNodes,
          spaceHubs,
          options: {
            iterations: 5000,
            temperature: 60,
            coolingRate: 0.998,
          },
        });
        setResult(res);
      } finally {
        setIsRunning(false);
      }
    }, 100);
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result.optimizedPlacements);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-950/80 border border-orange-700/60 rounded-xl text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">
                Train Distance Layout Optimizer
              </h3>
              <p className="text-xs text-zinc-400">
                Rearranges city blocks on the hex grid to minimize total train driving travel time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-6 overflow-y-auto flex-1">
          {/* Explanation Banner */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-zinc-200">
              <Train className="w-4 h-4 text-orange-400" />
              <span>Simulated Annealing Lattice Placement</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              The optimizer calculates the traffic volume (trains/minute) flowing between every
              pair of supplier and consumer blocks. It moves and swaps blocks across hexes to place
              high-traffic supply chains right next to each other while keeping perimeter outposts anchored.
            </p>
          </div>

          {/* Results Display */}
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                    Initial Transit Cost
                  </span>
                  <span className="text-lg font-mono font-bold text-zinc-300">
                    {result.initialTransitCost.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">train·hops/m</span>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                    Optimized Cost
                  </span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {result.optimizedTransitCost.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">train·hops/m</span>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold block flex items-center justify-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Distance Reduced
                  </span>
                  <span className="text-xl font-mono font-extrabold text-emerald-300">
                    -{result.improvementPercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-emerald-500/80 block">
                    in {result.iterations} iterations
                  </span>
                </div>
              </div>

              {/* Block Coordinate Changes Table */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-zinc-300 mb-2">
                  Proposed Block Relocations:
                </h4>
                <div className="divide-y divide-zinc-800/60 max-h-48 overflow-y-auto">
                  {blocks.map((b) => {
                    const oldCoords = b.coordinates;
                    const newCoords = result.optimizedPlacements.get(b.id);
                    const isChanged =
                      !oldCoords ||
                      !newCoords ||
                      oldCoords.q !== newCoords.q ||
                      oldCoords.r !== newCoords.r;

                    return (
                      <div
                        key={b.id}
                        className="py-1.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FactorioIcon id={b.iconId} size={20} />
                          <span className="text-zinc-200 font-medium">{b.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-zinc-500">
                            {oldCoords ? `(${oldCoords.q},${oldCoords.r})` : 'Unplaced'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-600" />
                          <span
                            className={
                              isChanged ? 'text-orange-400 font-bold' : 'text-zinc-400'
                            }
                          >
                            {newCoords ? `(${newCoords.q},${newCoords.r})` : 'Unplaced'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-800 rounded-xl text-center gap-3">
              <Layers className="w-8 h-8 text-zinc-600" />
              <div className="text-xs text-zinc-400 max-w-sm">
                Ready to optimize placement for {blocks.length} factory blocks on this planet.
              </div>
              <button
                type="button"
                onClick={handleRunOptimization}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Simulating 5,000 Hex Placements...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run Layout Optimizer
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          {result && (
            <button
              type="button"
              onClick={handleRunOptimization}
              disabled={isRunning}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              Re-run Simulation
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              {result ? 'Discard' : 'Close'}
            </button>

            {result && (
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Apply Layout to Map
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
