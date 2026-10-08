import React, { useState, useEffect } from 'react';
import { Bookmark, Save, Trash2, FolderDown, Sparkles } from 'lucide-react';
import type { CityBlockConfig } from './types';

const STORAGE_KEY = 'factorio_tools_cityblock_presets_v1';

export const DEFAULT_PRESETS: CityBlockConfig[] = [
  {
    name: 'Processing Unit Block (4x Blueprints)',
    blueprintMultiplier: 4,
    totalStations: 8,
    trainWagons: 4,
    isLegendaryQuality: true,
    beltStackLevel: 4,
    allocationMode: 'train-throughput',
    entries: [
      {
        id: 'electronic-circuit',
        name: 'Electronic circuit',
        isFluid: false,
        inputRate: 200,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
      {
        id: 'advanced-circuit',
        name: 'Advanced circuit',
        isFluid: false,
        inputRate: 40,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
      {
        id: 'sulfuric-acid',
        name: 'Sulfuric acid',
        isFluid: true,
        inputRate: 100,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
    ],
  },
  {
    name: 'Advanced Circuit Block (4x Blueprints)',
    blueprintMultiplier: 4,
    totalStations: 8,
    trainWagons: 4,
    isLegendaryQuality: true,
    beltStackLevel: 4,
    allocationMode: 'train-throughput',
    entries: [
      {
        id: 'electronic-circuit',
        name: 'Electronic circuit',
        isFluid: false,
        inputRate: 120,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
      {
        id: 'plastic-bar',
        name: 'Plastic bar',
        isFluid: false,
        inputRate: 80,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
      {
        id: 'copper-cable',
        name: 'Copper cable',
        isFluid: false,
        inputRate: 360,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
    ],
  },
  {
    name: 'Low Density Structure (Space Age 2x)',
    blueprintMultiplier: 2,
    totalStations: 8,
    trainWagons: 4,
    isLegendaryQuality: true,
    beltStackLevel: 4,
    allocationMode: 'train-throughput',
    entries: [
      {
        id: 'copper-plate',
        name: 'Copper plate',
        isFluid: false,
        inputRate: 400,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
      {
        id: 'steel-plate',
        name: 'Steel plate',
        isFluid: false,
        inputRate: 40,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
      {
        id: 'plastic-bar',
        name: 'Plastic bar',
        isFluid: false,
        inputRate: 100,
        unit: 'per-sec',
        beltType: 'turbo',
        lockStations: null,
      },
    ],
  },
];

interface PresetManagerProps {
  currentConfig: CityBlockConfig;
  onLoadConfig: (config: CityBlockConfig) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentConfig,
  onLoadConfig,
}) => {
  const [customPresets, setCustomPresets] = useState<CityBlockConfig[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomPresets(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const toSave: CityBlockConfig = {
      ...currentConfig,
      name: newPresetName.trim(),
    };

    const updated = [...customPresets.filter((p) => p.name !== toSave.name), toSave];
    setCustomPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewPresetName('');
  };

  const handleDeletePreset = (name: string) => {
    const updated = customPresets.filter((p) => p.name !== name);
    setCustomPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22262e] hover:bg-[#2d333f] border border-[#2d333f] text-slate-200 text-xs font-medium transition cursor-pointer"
      >
        <Bookmark className="w-3.5 h-3.5 text-amber-500" />
        Presets ({DEFAULT_PRESETS.length + customPresets.length})
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#16191f] border border-[#2d333f] rounded-xl shadow-2xl z-40 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-[#2d333f]">
            <h4 className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              City Block Presets
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              Close
            </button>
          </div>

          {/* Built-in Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Space Age Defaults
            </span>
            {DEFAULT_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  onLoadConfig(p);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded bg-[#1f232b] hover:bg-[#2a303b] border border-transparent hover:border-amber-500/30 text-xs text-slate-200 transition flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate">{p.name}</span>
                <FolderDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
              </button>
            ))}
          </div>

          {/* User Saved Presets */}
          {customPresets.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#2d333f]">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Your Saved Blocks
              </span>
              {customPresets.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#1f232b] hover:bg-[#2a303b] text-xs text-slate-200 group"
                >
                  <button
                    onClick={() => {
                      onLoadConfig(p);
                      setIsOpen(false);
                    }}
                    className="truncate flex-1 text-left cursor-pointer hover:text-amber-400"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => handleDeletePreset(p.name)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Save Current as New Preset */}
          <form onSubmit={handleSavePreset} className="pt-2 border-t border-[#2d333f] space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Save Current Layout
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Name this block..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 px-2.5 py-1 bg-[#0e1014] border border-[#2d333f] rounded text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!newPresetName.trim()}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold rounded text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
