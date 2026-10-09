import React, { useState } from 'react';
import { X, Rocket, Sparkles, Check } from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import { ResourceSelector } from '../../../components/factorio/ResourceSelector';
import type { SpaceHubNode, SolidPlanetId } from '../types';
import { calculateSiloLaunches } from '../core/calculations';
import type { FactorioItem, FactorioFluid } from '../../../data/generated/types';

interface SpaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hub: SpaceHubNode) => void;
  planetId: SolidPlanetId;
}

export const SpaceHubModal: React.FC<SpaceHubModalProps> = ({
  isOpen,
  onClose,
  onSave,
  planetId,
}) => {
  const [type, setType] = useState<'rocket-silo' | 'cargo-landing-pad'>('rocket-silo');
  const [name, setName] = useState('Legendary Rocket Silo');
  const [cargoResourceId, setCargoResourceId] = useState('space-science-pack');
  const [target, setTarget] = useState('Orbital Cargo Platform');
  const [ratePerMinute, setRatePerMinute] = useState(1000);
  const [selectorOpen, setSelectorOpen] = useState(false);

  if (!isOpen) return null;

  const siloMetrics = calculateSiloLaunches({
    cargoResourceId,
    ratePerMinute,
  });

  const handleSave = () => {
    const hub: SpaceHubNode = {
      id: `hub-${planetId}-${Date.now()}`,
      type,
      planetId,
      name: name.trim() || 'Orbital Space Hub',
      coordinates: null,
      isLegendarySilo: true,
      targetPlatformOrPlanet: target.trim(),
      cargoResourceId,
      ratePerMinute,
      launchesPerMinute: siloMetrics.launchesPerMinute,
    };
    onSave(hub);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Rocket className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-zinc-100 text-base">Add Space Logistics Hub</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4">
          {/* Type Switcher */}
          <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setType('rocket-silo');
                setName('Legendary Rocket Silo');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                type === 'rocket-silo'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🚀 Rocket Silo (Export)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('cargo-landing-pad');
                setName('Cargo Landing Pad');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                type === 'cargo-landing-pad'
                  ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🛰️ Landing Pad (Import)
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Hub Label / Station Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Target */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Target Platform or Planet
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. Nauvis Orbit Platform"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Resource */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Transferred Cargo
            </label>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <FactorioIcon id={cargoResourceId} size={28} />
              </div>
              <button
                type="button"
                onClick={() => setSelectorOpen(true)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition cursor-pointer"
              >
                Change Cargo
              </button>
            </div>
          </div>

          {/* Rate */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Throughput Rate (/min)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={ratePerMinute}
              onChange={(e) => setRatePerMinute(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Factorio 2.1 Legendary Silo Stats Preview */}
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-[11px] uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Legendary Rocket Silo (+150% Craft Speed)</span>
            </div>
            <div className="flex justify-between text-zinc-300 font-mono text-[11px]">
              <span className="text-zinc-500">Item Unit Weight:</span>
              <span>{siloMetrics.weightPerItemKg.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between text-zinc-300 font-mono text-[11px]">
              <span className="text-zinc-500">Rocket Payload Cap:</span>
              <span>{siloMetrics.capacityPerRocket.toLocaleString()} items (1,000 kg)</span>
            </div>
            <div className="flex justify-between text-orange-400 font-mono font-bold text-xs pt-1 border-t border-purple-900/50">
              <span>Launches Required:</span>
              <span>{siloMetrics.launchesPerMinute.toFixed(2)} rockets/min</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
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
            Add Hub
          </button>
        </div>
      </div>

      <ResourceSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(res: FactorioItem | FactorioFluid) => {
          setCargoResourceId(res.id);
          setSelectorOpen(false);
        }}
      />
    </div>
  );
};
