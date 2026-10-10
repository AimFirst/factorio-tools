import React, { useState, useEffect } from 'react';
import { X, Rocket, Check, ShieldCheck } from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import { ResourceSelector } from '../../../components/factorio/ResourceSelector';
import type { InterplanetaryRoute, SolidPlanetId } from '../types';
import { calculateInterplanetaryRoute } from '../core/calculations';
import type { FactorioItem, FactorioFluid } from '../../../data/generated/types';

interface InterplanetaryRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (route: InterplanetaryRoute) => void;
  initialRoute?: InterplanetaryRoute | null;
}

const LOCATION_OPTIONS: Array<{
  id: SolidPlanetId | 'platform';
  label: string;
  color: string;
}> = [
  { id: 'nauvis', label: 'Nauvis', color: '#22c55e' },
  { id: 'vulcanus', label: 'Vulcanus', color: '#ef4444' },
  { id: 'gleba', label: 'Gleba', color: '#84cc16' },
  { id: 'fulgora', label: 'Fulgora', color: '#eab308' },
  { id: 'aquilo', label: 'Aquilo', color: '#06b6d4' },
  { id: 'platform', label: 'Space Platform (Orbit)', color: '#a855f7' },
];

export const InterplanetaryRouteModal: React.FC<InterplanetaryRouteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRoute,
}) => {
  const [sourcePlanet, setSourcePlanet] = useState<SolidPlanetId | 'platform'>('vulcanus');
  const [targetPlanet, setTargetPlanet] = useState<SolidPlanetId | 'platform'>('nauvis');
  const [sourceHubName, setSourceHubName] = useState('Rocket Silo Complex');
  const [targetHubName, setTargetHubName] = useState('Cargo Landing Pad');
  const [resourceId, setResourceId] = useState('metallurgic-science-pack');
  const [ratePerSecond, setRatePerSecond] = useState(20);
  const [notes, setNotes] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    if (initialRoute) {
      setSourcePlanet(initialRoute.sourcePlanet);
      setTargetPlanet(initialRoute.targetPlanet);
      setSourceHubName(initialRoute.sourceHubName || 'Rocket Silo Complex');
      setTargetHubName(initialRoute.targetHubName || 'Cargo Landing Pad');
      setResourceId(initialRoute.resourceId);
      setRatePerSecond(initialRoute.ratePerSecond);
      setNotes(initialRoute.notes || '');
    } else {
      setSourcePlanet('vulcanus');
      setTargetPlanet('nauvis');
      setSourceHubName('Vulcanus Silo Complex');
      setTargetHubName('Nauvis Central Landing Pad');
      setResourceId('metallurgic-science-pack');
      setRatePerSecond(20);
      setNotes('Legendary Rocket Silo delivery');
    }
  }, [initialRoute, isOpen]);

  if (!isOpen) return null;

  const metrics = calculateInterplanetaryRoute({
    cargoResourceId: resourceId,
    ratePerSecond,
  });

  const handleSave = () => {
    const route: InterplanetaryRoute = {
      id: initialRoute?.id || `route-${Date.now()}`,
      sourcePlanet,
      targetPlanet,
      sourceHubName: sourceHubName.trim() || 'Rocket Silo Complex',
      targetHubName: targetHubName.trim() || 'Cargo Landing Pad',
      resourceId,
      ratePerSecond,
      weightPerItemKg: metrics.weightPerItemKg,
      capacityPerRocket: metrics.capacityPerRocket,
      launchesPerMinute: metrics.launchesPerMinute,
      silosRequired: metrics.silosRequired,
      notes: notes.trim(),
    };
    onSave(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-950/80 rounded-xl border border-purple-800 text-purple-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">
                {initialRoute ? 'Edit Interplanetary Route' : 'Establish Trade Route'}
              </h3>
              <p className="text-xs text-zinc-400">
                Factorio 2.1 Cargo Rocket & Orbital Delivery
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

        {/* Route Origin & Destination */}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Origin Location
            </label>
            <select
              value={sourcePlanet}
              onChange={(e) =>
                setSourcePlanet(e.target.value as SolidPlanetId | 'platform')
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={sourceHubName}
              onChange={(e) => setSourceHubName(e.target.value)}
              placeholder="Origin Silo Name"
              className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Destination Location
            </label>
            <select
              value={targetPlanet}
              onChange={(e) =>
                setTargetPlanet(e.target.value as SolidPlanetId | 'platform')
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={targetHubName}
              onChange={(e) => setTargetHubName(e.target.value)}
              placeholder="Destination Landing Pad"
              className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Resource & Rate Selection */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Transferred Cargo
            </label>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-zinc-900 rounded-lg border border-zinc-800 shrink-0">
                <FactorioIcon id={resourceId} size={28} />
              </div>
              <button
                type="button"
                onClick={() => setSelectorOpen(true)}
                className="flex-1 px-2.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 transition cursor-pointer text-left truncate"
              >
                Change Item
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Throughput Rate (/s)
            </label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={ratePerSecond}
              onChange={(e) =>
                setRatePerSecond(Math.max(0.1, parseFloat(e.target.value) || 0))
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-sm focus:outline-none focus:border-purple-500"
            />
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              = {(ratePerSecond * 60).toLocaleString()} /min
            </div>
          </div>
        </div>

        {/* Factorio 2.1 Legendary Silo Logistics Calculation Box */}
        <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300 border-b border-zinc-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Factorio 2.1 Legendary Silo Logistics
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950 text-purple-200 border border-purple-800">
              1,000 kg Payload
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500 uppercase font-medium">
                Item Weight
              </div>
              <div className="font-mono text-zinc-200 font-semibold mt-0.5">
                {metrics.weightPerItemKg.toFixed(2)} kg
              </div>
            </div>

            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500 uppercase font-medium">
                Rocket Capacity
              </div>
              <div className="font-mono text-zinc-200 font-semibold mt-0.5">
                {metrics.capacityPerRocket.toLocaleString()} items
              </div>
            </div>

            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500 uppercase font-medium">
                Launch Frequency
              </div>
              <div className="font-mono text-purple-400 font-semibold mt-0.5">
                {metrics.launchesPerMinute.toFixed(2)} /min
              </div>
            </div>

            <div className="p-2 bg-zinc-950/80 rounded-lg border border-purple-900/50">
              <div className="text-[10px] text-purple-400 uppercase font-medium">
                Legendary Silos
              </div>
              <div className="font-mono text-purple-200 font-bold mt-0.5">
                {metrics.silosRequired} Silo{metrics.silosRequired > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">
            Route Notes & Directives
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Spoilage priority launch, buffer in orbital hub"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {initialRoute ? 'Save Route' : 'Establish Route'}
          </button>
        </div>
      </div>

      <ResourceSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(res: FactorioItem | FactorioFluid) => {
          setResourceId(res.id);
          setSelectorOpen(false);
        }}
      />
    </div>
  );
};
