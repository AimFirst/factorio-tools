import React, { useState, useEffect } from 'react';
import { X, Train, Layers, Check, Trash2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import { ResourceSelector } from '../../../components/factorio/ResourceSelector';
import { ResourceFlowTable } from './ResourceFlowTable';
import type { BlockResourceFlow, HexBlock, SolidPlanetId } from '../types';
import type { FactorioItem, FactorioFluid } from '../../../data/generated/types';

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: HexBlock) => void;
  onDelete?: (blockId: string) => void;
  initialBlock: HexBlock | null;
  planetId: SolidPlanetId;
}

const PRESET_COLORS = [
  '#f97316', // Orange (Default Factorio)
  '#3b82f6', // Blue (Circuits / High-tech)
  '#10b981', // Emerald (Bio / Uranium / Smelting)
  '#ef4444', // Red (Military / Heavy)
  '#a855f7', // Purple (EM / Space)
  '#eab308', // Yellow (Sulfur / Logistics)
  '#06b6d4', // Cyan (Cryo / Fluids)
];

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialBlock,
  planetId,
}) => {
  const [name, setName] = useState('');
  const [iconId, setIconId] = useState('iron-plate');
  const [blueprintMultiplier, setBlueprintMultiplier] = useState(1);
  const [color, setColor] = useState('#f97316');
  const [notes, setNotes] = useState('');
  const [inputs, setInputs] = useState<BlockResourceFlow[]>([]);
  const [outputs, setOutputs] = useState<BlockResourceFlow[]>([]);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => {
    if (initialBlock) {
      setName(initialBlock.name);
      setIconId(initialBlock.iconId);
      setBlueprintMultiplier(initialBlock.blueprintMultiplier || 1);
      setColor(initialBlock.color || '#f97316');
      setNotes(initialBlock.notes || '');
      setInputs(initialBlock.inputs);
      setOutputs(initialBlock.outputs);
    } else {
      setName('New Manufacturing Block');
      setIconId('electronic-circuit');
      setBlueprintMultiplier(1);
      setColor('#f97316');
      setNotes('');
      setInputs([]);
      setOutputs([]);
    }
  }, [initialBlock, isOpen]);

  if (!isOpen) return null;

  const totalInputTrainsPerMin = inputs.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalOutputTrainsPerMin = outputs.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalInputBays = inputs.reduce((sum, f) => sum + f.allocatedBays, 0);
  const totalOutputBays = outputs.reduce((sum, f) => sum + f.allocatedBays, 0);
  const totalBlockTrains = totalInputTrainsPerMin + totalOutputTrainsPerMin;

  const handleSave = () => {
    const block: HexBlock = {
      id: initialBlock?.id || `block-${planetId}-${Date.now()}`,
      planetId,
      name: name.trim() || 'Manufacturing Block',
      iconId,
      coordinates: initialBlock?.coordinates || null,
      blueprintMultiplier: Math.max(1, blueprintMultiplier),
      color,
      inputs,
      outputs,
      notes: notes.trim(),
    };
    onSave(block);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ borderTopColor: color, borderTopWidth: 3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-4 flex-1">
            {/* Clickable Icon */}
            <button
              type="button"
              onClick={() => setIconPickerOpen(true)}
              className="p-2 bg-zinc-900 border border-zinc-700/80 hover:border-orange-500 rounded-xl transition cursor-pointer relative group"
              title="Click to change block icon"
            >
              <FactorioIcon id={iconId} size={36} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-[10px] text-white font-medium transition">
                Change
              </div>
            </button>

            {/* Name Input */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Block Name (e.g. Electronic Circuits)"
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-100 font-semibold text-lg focus:outline-none focus:border-orange-500 transition"
              />
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                <span className="capitalize text-zinc-300 font-medium">{planetId} World</span>
                {initialBlock?.coordinates && (
                  <span className="font-mono text-zinc-500">
                    Hex ({initialBlock.coordinates.q}, {initialBlock.coordinates.r})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Config & Close */}
          <div className="flex items-center gap-4">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2 py-1.5 rounded-lg border border-zinc-800">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-4 h-4 rounded-full transition cursor-pointer border ${
                    color === c ? 'scale-125 border-white shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Blueprint Multiplier */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-zinc-400">Copies:</span>
              <input
                type="number"
                min="1"
                max="64"
                value={blueprintMultiplier}
                onChange={(e) => setBlueprintMultiplier(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-10 text-center bg-zinc-950 border border-zinc-800 rounded px-1 text-zinc-200 font-mono font-bold text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Outputs (Production) Table */}
          <ResourceFlowTable
            title="Produced Outputs"
            type="output"
            flows={outputs}
            onChange={setOutputs}
          />

          {/* Inputs (Consumption) Table */}
          <ResourceFlowTable
            title="Consumed Inputs"
            type="input"
            flows={inputs}
            onChange={setInputs}
          />

          {/* Notes */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Block Design & Blueprint Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 8 beacon 12 assembler setup, uses direct insertion for wire, requires landfill..."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500 font-sans"
            />
          </div>
        </div>

        {/* Summary Footer */}
        <div className="border-t border-zinc-800/80 bg-zinc-900/80 px-6 py-4 flex items-center justify-between gap-4">
          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-zinc-500">Inbound: </span>
                <span className="font-mono text-zinc-200 font-bold">
                  {totalInputTrainsPerMin.toFixed(2)}
                </span>
                <span className="text-zinc-500"> tr/m ({totalInputBays} bays)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-zinc-500">Outbound: </span>
                <span className="font-mono text-zinc-200 font-bold">
                  {totalOutputTrainsPerMin.toFixed(2)}
                </span>
                <span className="text-zinc-500"> tr/m ({totalOutputBays} bays)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-zinc-800">
              <Train className="w-4 h-4 text-orange-400" />
              <div>
                <span className="text-zinc-500">Total Rail Trips: </span>
                <span className="font-mono text-orange-400 font-bold">
                  {totalBlockTrains.toFixed(2)}
                </span>
                <span className="text-zinc-500"> tr/m</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {initialBlock && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete block "${initialBlock.name}"?`)) {
                    onDelete(initialBlock.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/50 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Block
              </button>
            )}

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
              className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-orange-600/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save Block
            </button>
          </div>
        </div>
      </div>

      {/* Icon Picker */}
      <ResourceSelector
        isOpen={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(res: FactorioItem | FactorioFluid) => {
          setIconId(res.id);
          setIconPickerOpen(false);
        }}
      />
    </div>
  );
};
