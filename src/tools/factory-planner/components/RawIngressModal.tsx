import React, { useState } from 'react';
import { X, Mountain, Check } from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import { ResourceSelector } from '../../../components/factorio/ResourceSelector';
import type { RawIngressNode, SolidPlanetId } from '../types';
import type { FactorioItem, FactorioFluid } from '../../../data/generated/types';

interface RawIngressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: RawIngressNode) => void;
  planetId: SolidPlanetId;
}

export const RawIngressModal: React.FC<RawIngressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  planetId,
}) => {
  const [name, setName] = useState('Ore Outpost Depot');
  const [resourceId, setResourceId] = useState('iron-ore');
  const [ratePerSecond, setRatePerSecond] = useState(400);
  const [selectorOpen, setSelectorOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const node: RawIngressNode = {
      id: `raw-${planetId}-${Date.now()}`,
      resourceId,
      planetId,
      name: name.trim() || 'Raw Ingress Depot',
      ratePerSecond: Math.max(0, ratePerSecond),
      coordinates: null,
    };
    onSave(node);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Mountain className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-zinc-100 text-base">Add Mining Outpost Ingress</h3>
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
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Outpost Depot Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Mined Resource
            </label>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <FactorioIcon id={resourceId} size={28} />
              </div>
              <button
                type="button"
                onClick={() => setSelectorOpen(true)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition cursor-pointer"
              >
                Change Resource
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Supply Rate (/s)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={ratePerSecond}
              onChange={(e) => setRatePerSecond(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-sm focus:outline-none focus:border-orange-500"
            />
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              = {(ratePerSecond * 60).toLocaleString()} /min
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
            className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Add Outpost
          </button>
        </div>
      </div>

      <ResourceSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(res: FactorioItem | FactorioFluid) => {
          setResourceId(res.id);
          setName(`${res.name} Outpost`);
          setSelectorOpen(false);
        }}
      />
    </div>
  );
};
