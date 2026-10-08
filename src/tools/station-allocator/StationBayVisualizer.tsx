import React from 'react';
import { Clock, Gauge, Lock, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { FactorioIcon } from '../../components/factorio/FactorioIcon';
import type { ApportionmentResult, AllocatedResourceResult, CongestionLevel } from '../../lib/apportionment';
import { getEffectiveBeltSpeed, type BeltStackLevel } from '../../types';

interface StationBayVisualizerProps {
  result: ApportionmentResult;
  blueprintMultiplier: number;
  beltStackLevel: BeltStackLevel;
}

const CONGESTION_DETAILS: Record<
  CongestionLevel,
  { label: string; desc: string; threshold: string }
> = {
  critical: {
    label: 'Critical Bottleneck',
    desc: 'Trains arrive every < 25s. Severe risk of rail junction deadlocks, signal stalling, and stacker overflow. Add dedicated bays or bypass tracks.',
    threshold: '< 25s per train',
  },
  heavy: {
    label: 'Heavy Rail Traffic',
    desc: 'Trains arrive every 25s–50s. High traffic corridor. Ensure adequate train stacker queue bays and chain signaling.',
    threshold: '25s – 50s per train',
  },
  optimal: {
    label: 'Optimal Cadence',
    desc: 'Trains arrive every 50s–300s (5m). Healthy, balanced throughput. Unloading buffers stay filled without stressing intersections.',
    threshold: '50s – 300s per train',
  },
  light: {
    label: 'Light / Infrequent',
    desc: 'Trains arrive every > 5 minutes. Very low traffic impact; station remains idle most of the time.',
    threshold: '> 300s per train',
  },
};

export const StationBayVisualizer: React.FC<StationBayVisualizerProps> = ({
  result,
  blueprintMultiplier,
  beltStackLevel,
}) => {
  const { totalStations, allocations, warnings, isOverCapacity } = result;

  // Flatten allocations into individual station bays
  const bays: {
    stationNumber: number;
    resource?: AllocatedResourceResult;
  }[] = [];

  let currentBay = 1;
  for (const alloc of allocations) {
    for (let i = 0; i < alloc.allocatedStations; i++) {
      if (currentBay <= totalStations) {
        bays.push({
          stationNumber: currentBay,
          resource: alloc,
        });
        currentBay++;
      }
    }
  }

  // Fill in any unused spare stations
  while (currentBay <= totalStations) {
    bays.push({
      stationNumber: currentBay,
      resource: undefined,
    });
    currentBay++;
  }

  return (
    <div className="space-y-4">
      {/* Top Banner & Alerts */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* City Block Rail Yard Diagram */}
      <div className="p-5 rounded-xl bg-[#14171d] border border-[#2d333f] shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#2d333f]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-semibold text-base text-slate-100">
                City Block Station Bays ({totalStations} Unloading Stations)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured for <span className="text-amber-400 font-medium">{blueprintMultiplier}x</span> blueprint copies &bull; Belt stacking: <span className="text-emerald-400 font-medium">{beltStackLevel}x ({getEffectiveBeltSpeed('turbo', beltStackLevel)} it/s on Green)</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Traffic Guide Popover */}
            <div className="relative group cursor-help">
              <div className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Traffic Guide</span>
              </div>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-72 p-3 rounded-xl bg-[#0e1015] border border-[#3f4756] shadow-2xl space-y-2 text-xs">
                <div className="font-semibold text-slate-200 border-b border-[#2d333f] pb-1">
                  Train Arrival Traffic Levels
                </div>
                {(['critical', 'heavy', 'optimal', 'light'] as const).map((key) => {
                  const detail = CONGESTION_DETAILS[key];
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span
                          className={`font-semibold ${
                            key === 'critical'
                              ? 'text-rose-400'
                              : key === 'heavy'
                              ? 'text-amber-400'
                              : key === 'optimal'
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {detail.label}
                        </span>
                        <span className="text-slate-400 text-[10px]">{detail.threshold}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{detail.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-md text-xs font-mono font-medium border ${
                isOverCapacity
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              {result.usedStations} / {totalStations} Stations Allocated
            </span>
          </div>
        </div>

        {/* Station Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {bays.map((bay) => {
            const res = bay.resource;

            if (!res) {
              return (
                <div
                  key={bay.stationNumber}
                  className="p-3.5 rounded-lg border border-dashed border-[#2d333f] bg-[#111317]/60 flex flex-col justify-between min-h-[140px]"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Bay #{bay.stationNumber}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#1e222a] text-slate-400">Spare</span>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500 italic">Unassigned Slot</p>
                    <p className="text-[11px] text-slate-600">Available for fuel or future inputs</p>
                  </div>
                </div>
              );
            }

            const turboBeltSpeed = getEffectiveBeltSpeed('turbo', beltStackLevel);
            const turboBeltCount = !res.isFluid
              ? (res.ratePerStation / turboBeltSpeed).toFixed(2)
              : null;

            const cadenceFormatted =
              res.secondsBetweenTrains === Infinity
                ? 'No demand'
                : res.secondsBetweenTrains < 60
                ? `${Math.round(res.secondsBetweenTrains)}s`
                : `${(res.secondsBetweenTrains / 60).toFixed(1)}m`;

            return (
              <div
                key={bay.stationNumber}
                className={`p-3.5 rounded-lg border transition flex flex-col justify-between min-h-[140px] relative overflow-visible ${
                  res.isFluid
                    ? 'bg-[#121b22] border-cyan-800/40 hover:border-cyan-600/60'
                    : 'bg-[#181d24] border-amber-800/40 hover:border-amber-600/60'
                }`}
              >
                {/* Station Bay Number Header */}
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-black/40 text-slate-300 font-semibold border border-white/5">
                    Bay #{bay.stationNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {res.isLocked && (
                      <span title="Locked Station" className="text-amber-400">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}

                    {/* Interactive Congestion Tooltip */}
                    <div className="relative group/tip cursor-help">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono border flex items-center gap-1 ${
                          res.congestion === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : res.congestion === 'heavy'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : res.congestion === 'optimal'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                        }`}
                      >
                        {res.congestion}
                      </span>

                      {/* Tooltip Popup */}
                      <div className="absolute right-0 top-full mt-1.5 hidden group-hover/tip:block z-50 w-64 p-2.5 rounded-lg bg-[#0d0f14] border border-[#3f4756] shadow-2xl text-left pointer-events-none">
                        <div className="font-semibold text-xs text-slate-100 flex items-center justify-between mb-1">
                          <span>{CONGESTION_DETAILS[res.congestion].label}</span>
                          <span className="text-[10px] font-mono text-amber-400">
                            {CONGESTION_DETAILS[res.congestion].threshold}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          {CONGESTION_DETAILS[res.congestion].desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resource Info */}
                <div className="space-y-1 my-1">
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-100 truncate">
                    <FactorioIcon id={res.id} name={res.name} isFluid={res.isFluid} size="xs" />
                    <span className="truncate">{res.name}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Rate: <span className="text-slate-200 font-medium">{Math.round(res.ratePerStation).toLocaleString()}</span>{' '}
                    {res.isFluid ? 'units/s' : 'items/s'}
                  </div>
                </div>

                {/* Station Cadence & Belts */}
                <div className="mt-2 pt-2 border-t border-white/5 space-y-1 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Cadence:
                    </span>
                    <span className="text-amber-300 font-medium">1 train / {cadenceFormatted}</span>
                  </div>

                  {!res.isFluid ? (
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-slate-500" />
                        Green ({beltStackLevel}x stack):
                      </span>
                      <span className="text-emerald-400 font-medium">{turboBeltCount} belts</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-slate-500" />
                        Pipe Flow:
                      </span>
                      <span className="text-cyan-400 font-medium">
                        {Math.round(res.ratePerStation).toLocaleString()}/s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Summary Footprint */}
        <div className="mt-5 pt-4 border-t border-[#2d333f] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Total Trains / Hour</span>
            <span className="text-sm font-mono font-semibold text-slate-200">
              {allocations.reduce((acc, r) => acc + r.trainsPerHourTotal, 0).toFixed(1)} trains/h
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Average Inter-Arrival</span>
            <span className="text-sm font-mono font-semibold text-amber-400">
              {(() => {
                const totalTrains = allocations.reduce((acc, r) => acc + r.trainsPerHourTotal, 0);
                if (totalTrains <= 0) return 'N/A';
                const avgSec = 3600 / totalTrains;
                return `1 train every ${avgSec < 60 ? Math.round(avgSec) + 's' : (avgSec / 60).toFixed(1) + 'm'}`;
              })()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Unique Input Types</span>
            <span className="text-sm font-mono font-semibold text-slate-200">
              {allocations.length} resources
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Quality Level</span>
            <span className="text-sm font-mono font-semibold text-amber-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              Legendary (2.5x capacity)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
