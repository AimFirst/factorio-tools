import React, { useState, useEffect } from 'react';
import { X, Satellite, Check, Sparkles } from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import type { SpacePlatform } from '../types';

interface SpacePlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (platform: SpacePlatform) => void;
  initialPlatform?: SpacePlatform | null;
}

const ORBIT_OPTIONS: Array<{
  id: SpacePlatform['currentOrbit'];
  label: string;
  color: string;
}> = [
  { id: 'nauvis', label: 'Nauvis Orbit', color: '#22c55e' },
  { id: 'vulcanus', label: 'Vulcanus Orbit', color: '#ef4444' },
  { id: 'gleba', label: 'Gleba Orbit', color: '#84cc16' },
  { id: 'fulgora', label: 'Fulgora Orbit', color: '#eab308' },
  { id: 'aquilo', label: 'Aquilo Orbit', color: '#06b6d4' },
  { id: 'solar-system-edge', label: 'Solar System Edge', color: '#8b5cf6' },
  { id: 'shattered-planet', label: 'Shattered Planet Orbit', color: '#ec4899' },
];

export const SpacePlatformModal: React.FC<SpacePlatformModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPlatform,
}) => {
  const [name, setName] = useState('Orbital Science Platform');
  const [currentOrbit, setCurrentOrbit] = useState<SpacePlatform['currentOrbit']>('nauvis');
  const [produceSpaceScience, setProduceSpaceScience] = useState(true);
  const [spaceScienceRate, setSpaceScienceRate] = useState(1000);
  const [producePromethiumScience, setProducePromethiumScience] = useState(false);
  const [promethiumScienceRate, setPromethiumScienceRate] = useState(1000);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialPlatform) {
      setName(initialPlatform.name);
      setCurrentOrbit(initialPlatform.currentOrbit);
      const spaceSci = initialPlatform.producedScience.find(
        (s) => s.resourceId === 'space-science-pack'
      );
      if (spaceSci) {
        setProduceSpaceScience(true);
        setSpaceScienceRate(spaceSci.ratePerMinute);
      } else {
        setProduceSpaceScience(false);
      }

      const promSci = initialPlatform.producedScience.find(
        (s) => s.resourceId === 'promethium-science-pack'
      );
      if (promSci) {
        setProducePromethiumScience(true);
        setPromethiumScienceRate(promSci.ratePerMinute);
      } else {
        setProducePromethiumScience(false);
      }
      setNotes(initialPlatform.notes || '');
    } else {
      setName('Orbital Science Platform');
      setCurrentOrbit('nauvis');
      setProduceSpaceScience(true);
      setSpaceScienceRate(1000);
      setProducePromethiumScience(false);
      setPromethiumScienceRate(1000);
      setNotes('');
    }
  }, [initialPlatform, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const producedScience: SpacePlatform['producedScience'] = [];
    if (produceSpaceScience && spaceScienceRate > 0) {
      producedScience.push({
        resourceId: 'space-science-pack',
        ratePerMinute: spaceScienceRate,
      });
    }
    if (producePromethiumScience && promethiumScienceRate > 0) {
      producedScience.push({
        resourceId: 'promethium-science-pack',
        ratePerMinute: promethiumScienceRate,
      });
    }

    const platform: SpacePlatform = {
      id: initialPlatform?.id || `platform-${Date.now()}`,
      name: name.trim() || 'Orbital Science Platform',
      currentOrbit,
      producedScience,
      notes: notes.trim(),
    };

    onSave(platform);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-950/80 rounded-xl border border-purple-800 text-purple-400">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">
                {initialPlatform ? 'Edit Space Platform' : 'Launch New Space Platform'}
              </h3>
              <p className="text-xs text-zinc-400">
                Factorio 2.1 Orbital Logistics & Asteroid Processing Hub
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

        {/* Form Body */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Platform Vessel Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nauvis Orbital Station Alpha"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Current Orbit */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Current Planetary Orbit
            </label>
            <select
              value={currentOrbit}
              onChange={(e) =>
                setCurrentOrbit(e.target.value as SpacePlatform['currentOrbit'])
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {ORBIT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Orbital Science Production */}
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Orbital Science Production (Asteroid Processing)
            </div>

            {/* Space Science */}
            <div className="flex items-center justify-between gap-3 p-2.5 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={produceSpaceScience}
                  onChange={(e) => setProduceSpaceScience(e.target.checked)}
                  className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                />
                <FactorioIcon id="space-science-pack" size={24} />
                <span className="text-xs font-medium text-zinc-200">
                  Space Science Pack
                </span>
              </label>

              {produceSpaceScience && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={spaceScienceRate}
                    onChange={(e) =>
                      setSpaceScienceRate(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-right font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-xs text-zinc-400 font-mono">/min</span>
                </div>
              )}
            </div>

            {/* Promethium Science */}
            <div className="flex items-center justify-between gap-3 p-2.5 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={producePromethiumScience}
                  onChange={(e) => setProducePromethiumScience(e.target.checked)}
                  className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                />
                <FactorioIcon id="promethium-science-pack" size={24} />
                <span className="text-xs font-medium text-zinc-200">
                  Promethium Science Pack
                </span>
              </label>

              {producePromethiumScience && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={promethiumScienceRate}
                    onChange={(e) =>
                      setPromethiumScienceRate(
                        Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-right font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-xs text-zinc-400 font-mono">/min</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Mission Directives / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Harvests metallic/carbonic asteroids in deep orbit to supply Nauvis research labs."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
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
            {initialPlatform ? 'Save Changes' : 'Deploy Platform'}
          </button>
        </div>
      </div>
    </div>
  );
};
