import React, { useState, useEffect } from 'react';
import { 
  X, 
  Train, 
  Layers, 
  Check, 
  Trash2, 
  ArrowDownRight, 
  ArrowUpRight, 
  Copy, 
  Link2, 
  Unlink, 
  Rocket, 
  Box, 
  Factory,
  AlertTriangle,
} from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import { ResourceSelector } from '../../../components/factorio/ResourceSelector';
import { ResourceFlowTable } from './ResourceFlowTable';
import type { BlockResourceFlow, HexBlock, HexCoordinates, SolidPlanetId } from '../types.ts';
import type { ResourceBalanceItem } from '../core/resource-balance.ts';
import { createResourceFlow } from '../core/calculations';
import type { FactorioItem, FactorioFluid } from '../../../data/generated/types';

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: HexBlock) => void;
  onDelete?: (blockId: string) => void;
  onDuplicate?: (blockId: string) => void;
  initialBlock: HexBlock | null;
  initialCoordinates?: HexCoordinates | null;
  initialBlockType?: 'manufacturing' | 'rocket-silo' | 'cargo-landing-pad';
  initialOutputResource?: { id: string; name: string; ratePerSecond?: number } | null;
  deficitMap?: Map<string, ResourceBalanceItem>;
  planetId: SolidPlanetId;
  sharedInstancesCount?: number;
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
  onDuplicate,
  initialBlock,
  initialCoordinates,
  initialBlockType,
  initialOutputResource,
  deficitMap,
  planetId,
  sharedInstancesCount = 1,
}) => {
  const [name, setName] = useState('');
  const [iconId, setIconId] = useState('iron-plate');
  const [blockType, setBlockType] = useState<'manufacturing' | 'rocket-silo' | 'cargo-landing-pad'>('manufacturing');
  const [sharedGroupId, setSharedGroupId] = useState<string | undefined>(undefined);
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [isIconManuallyEdited, setIsIconManuallyEdited] = useState(false);
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
      setBlockType(initialBlock.blockType || 'manufacturing');
      setSharedGroupId(initialBlock.sharedGroupId);
      setBlueprintMultiplier(initialBlock.blueprintMultiplier || 1);
      setColor(initialBlock.color || (initialBlock.blockType === 'rocket-silo' ? '#a855f7' : '#f97316'));
      setNotes(initialBlock.notes || '');
      setInputs(initialBlock.inputs);
      setOutputs(initialBlock.outputs);
      setIsNameManuallyEdited(true);
      setIsIconManuallyEdited(true);
    } else {
      const bType = initialBlockType || 'manufacturing';
      setBlockType(bType);
      setSharedGroupId(undefined);
      if (bType === 'rocket-silo') {
        setName('Rocket Silo Complex');
        setIconId('rocket-silo');
        setColor('#a855f7');
        setInputs([
          createResourceFlow({
            id: 'rocket-fuel',
            name: 'Rocket Fuel',
            isFluid: false,
            ratePerSecond: 10,
            wagonCount: 2,
            isLegendary: false,
            allocatedBays: 1,
          }),
          createResourceFlow({
            id: 'low-density-structure',
            name: 'Low Density Structure',
            isFluid: false,
            ratePerSecond: 10,
            wagonCount: 2,
            isLegendary: false,
            allocatedBays: 1,
          }),
          createResourceFlow({
            id: 'processing-unit',
            name: 'Processing Unit',
            isFluid: false,
            ratePerSecond: 5,
            wagonCount: 2,
            isLegendary: false,
            allocatedBays: 1,
          }),
        ]);
        setOutputs([]);
        setIsNameManuallyEdited(true);
        setIsIconManuallyEdited(true);
      } else if (bType === 'cargo-landing-pad') {
        setName('Orbital Cargo Landing Pad');
        setIconId('cargo-landing-pad');
        setColor('#06b6d4');
        setInputs([]);
        setOutputs([
          createResourceFlow({
            id: 'space-science-pack',
            name: 'Space Science Pack',
            isFluid: false,
            ratePerSecond: 16.67,
            wagonCount: 2,
            isLegendary: true,
            allocatedBays: 1,
          }),
        ]);
        setIsNameManuallyEdited(true);
        setIsIconManuallyEdited(true);
      } else if (initialOutputResource) {
        setName(initialOutputResource.name);
        setIconId(initialOutputResource.id);
        setColor('#f97316');
        setInputs([]);
        setOutputs([
          createResourceFlow({
            id: initialOutputResource.id,
            name: initialOutputResource.name,
            isFluid: false,
            ratePerSecond: initialOutputResource.ratePerSecond ?? 100,
            wagonCount: 2,
            isLegendary: false,
            allocatedBays: 1,
          }),
        ]);
        setIsNameManuallyEdited(true);
        setIsIconManuallyEdited(true);
      } else {
        setName('');
        setIconId('electronic-circuit');
        setColor('#f97316');
        setInputs([]);
        setOutputs([]);
        setIsNameManuallyEdited(false);
        setIsIconManuallyEdited(false);
      }
      setBlueprintMultiplier(1);
      setNotes('');
    }
  }, [initialBlock, initialBlockType, initialOutputResource, isOpen]);

  const handleOutputsChange = (newOutputs: BlockResourceFlow[]) => {
    setOutputs(newOutputs);
    // When creating a new city block, default icon and title to first output item unless manually overridden
    if (!initialBlock) {
      if (!isNameManuallyEdited) {
        if (newOutputs.length > 0) {
          setName(newOutputs[0].name);
        } else {
          setName('');
        }
      }
      if (!isIconManuallyEdited) {
        if (newOutputs.length > 0) {
          setIconId(newOutputs[0].id);
        } else {
          setIconId('electronic-circuit');
        }
      }
    }
  };

  if (!isOpen) return null;

  const totalInputTrainsPerMin = inputs.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalOutputTrainsPerMin = outputs.reduce((sum, f) => sum + f.trainsPerMinute, 0);
  const totalInputBays = inputs.reduce((sum, f) => sum + f.allocatedBays, 0);
  const totalOutputBays = outputs.reduce((sum, f) => sum + f.allocatedBays, 0);
  const totalBlockTrains = totalInputTrainsPerMin + totalOutputTrainsPerMin;

  const addQuickSiloInput = (resId: string, resName: string, rate: number) => {
    if (inputs.some((inp) => inp.id === resId)) return;
    const newFlow = createResourceFlow({
      id: resId,
      name: resName,
      isFluid: false,
      ratePerSecond: rate,
      wagonCount: 2,
      isLegendary: false,
      allocatedBays: 1,
    });
    setInputs([...inputs, newFlow]);
  };

  const handleSave = () => {
    const defaultTitle =
      blockType === 'rocket-silo'
        ? 'Rocket Silo Complex'
        : blockType === 'cargo-landing-pad'
        ? 'Orbital Cargo Landing Pad'
        : 'Manufacturing Block';

    const block: HexBlock = {
      id: initialBlock?.id || `block-${planetId}-${Date.now()}`,
      planetId,
      name: name.trim() || (outputs[0]?.name ?? defaultTitle),
      iconId,
      coordinates: initialBlock?.coordinates || initialCoordinates || null,
      blueprintMultiplier: Math.max(1, blueprintMultiplier),
      color,
      blockType,
      sharedGroupId,
      inputs,
      outputs,
      notes: notes.trim(),
    };
    onSave(block);
    onClose();
  };

  const handleAnalyzeInAllocator = () => {
    const totalBays =
      inputs.reduce((sum, f) => sum + f.allocatedBays, 0) || Math.max(4, inputs.length);
    const resolvedName = name.trim() || (outputs[0]?.name ?? (blockType === 'rocket-silo' ? 'Rocket Silo' : 'Custom Block'));
    const blockIdToSave = initialBlock?.id || `block-${planetId}-${Date.now()}`;
    const blockToSave: HexBlock = {
      id: blockIdToSave,
      planetId,
      name: resolvedName,
      iconId,
      coordinates: initialBlock?.coordinates || initialCoordinates || null,
      blueprintMultiplier: Math.max(1, blueprintMultiplier),
      color,
      blockType,
      sharedGroupId,
      inputs,
      outputs,
      notes: notes.trim(),
    };
    // Save block so it's in the project for the allocator to update
    onSave(blockToSave);

    const cfg = {
      name: `${resolvedName} (City Block)`,
      blueprintMultiplier: Math.max(1, blueprintMultiplier),
      totalStations: totalBays,
      trainWagons: inputs[0]?.wagonCount || 2,
      isLegendaryQuality: inputs[0]?.isLegendary || false,
      beltStackLevel: 4,
      allocationMode: 'train-throughput' as const,
      entries: inputs.map((inp) => ({
        id: inp.id,
        name: inp.name,
        isFluid: inp.isFluid,
        inputRate: inp.ratePerSecond,
        unit: 'per-sec' as const,
        beltType: 'turbo' as const,
        lockStations: inp.allocatedBays || null,
      })),
    };
    const sharedPayload = {
      sourceBlock: {
        planetId,
        blockId: blockIdToSave,
        blockName: resolvedName,
      },
      config: cfg,
    };
    try {
      window.localStorage.setItem('factorio_shared_block_for_allocator', JSON.stringify(sharedPayload));
      window.dispatchEvent(new CustomEvent('switch-tool', { detail: { toolId: 'station-allocator' } }));
      onClose();
    } catch (e) {
      console.error('Failed to link to station allocator', e);
    }
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
                onChange={(e) => {
                  setName(e.target.value);
                  setIsNameManuallyEdited(true);
                }}
                placeholder={outputs.length > 0 ? outputs[0].name : "Block Name (e.g. Electronic Circuits)"}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-100 font-semibold text-lg focus:outline-none focus:border-orange-500 transition"
              />
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                <span className="capitalize text-zinc-300 font-medium">{planetId} World</span>
                {(initialBlock?.coordinates || initialCoordinates) && (
                  <span className="font-mono text-zinc-500">
                    Hex ({(initialBlock?.coordinates || initialCoordinates)?.q}, {(initialBlock?.coordinates || initialCoordinates)?.r})
                  </span>
                )}
                {blockType !== 'manufacturing' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-purple-900/60 text-purple-300 border border-purple-700/60">
                    {blockType === 'rocket-silo' ? 'Rocket Silo' : 'Cargo Pad'}
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

        {/* Block Type Bar & Shared Blueprint Banner */}
        <div className="px-6 py-2.5 bg-zinc-900/40 border-b border-zinc-800 flex items-center justify-between gap-4 text-xs">
          {/* Block Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Block Type:</span>
            <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setBlockType('manufacturing');
                  if (color === '#a855f7' || color === '#06b6d4') setColor('#f97316');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  blockType === 'manufacturing'
                    ? 'bg-orange-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                Manufacturing
              </button>
              <button
                type="button"
                onClick={() => {
                  setBlockType('rocket-silo');
                  setIconId('rocket-silo');
                  setColor('#a855f7');
                  if (!name || name === 'Manufacturing Block') setName('Rocket Silo Complex');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  blockType === 'rocket-silo'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                Rocket Silo
              </button>
              <button
                type="button"
                onClick={() => {
                  setBlockType('cargo-landing-pad');
                  setIconId('cargo-landing-pad');
                  setColor('#06b6d4');
                  if (!name || name === 'Manufacturing Block') setName('Orbital Cargo Landing Pad');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  blockType === 'cargo-landing-pad'
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                Cargo Pad
              </button>
            </div>
          </div>

          {/* Shared Blueprint Indicator */}
          {sharedGroupId && (
            <div className="flex items-center gap-3 bg-purple-950/40 border border-purple-800/60 rounded-lg px-3 py-1 text-purple-300">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  Shared Blueprint ({sharedInstancesCount} linked block{sharedInstancesCount > 1 ? 's' : ''} on grid)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSharedGroupId(undefined)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-medium transition cursor-pointer"
                title="Detach this block into an independent blueprint"
              >
                <Unlink className="w-3 h-3 text-amber-400" />
                Unlink / Make Unique
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Rocket Silo Helper Banner */}
          {blockType === 'rocket-silo' && (
            <div className="bg-purple-950/30 border border-purple-900/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900/40 rounded-lg text-purple-400 border border-purple-800/60">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-purple-200">Factorio 2.1 Legendary Rocket Silo</div>
                  <div className="text-zinc-400 text-[11px]">
                    18.28s launch cycle (47% faster than normal 26.95s). Consumes 50 LDS, 50 Rocket Fuel, 50 Processing Units per rocket.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-400 text-[11px] mr-1">Quick Add:</span>
                <button
                  type="button"
                  onClick={() => addQuickSiloInput('rocket-fuel', 'Rocket Fuel', 10)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-200 cursor-pointer transition"
                >
                  + Rocket Fuel
                </button>
                <button
                  type="button"
                  onClick={() => addQuickSiloInput('low-density-structure', 'Low Density Structure', 10)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-200 cursor-pointer transition"
                >
                  + LDS
                </button>
                <button
                  type="button"
                  onClick={() => addQuickSiloInput('processing-unit', 'Processing Unit', 5)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-200 cursor-pointer transition"
                >
                  + Blue Chips
                </button>
              </div>
            </div>
          )}

          {/* Outputs (Production) Table */}
          <ResourceFlowTable
            title={blockType === 'cargo-landing-pad' ? 'Imported Orbital Cargo (Outputs into Base)' : 'Produced Outputs'}
            type="output"
            flows={outputs}
            onChange={handleOutputsChange}
          />

          {/* Inputs (Consumption) Table */}
          {inputs.some((inp) => deficitMap?.has(inp.id)) && (
            <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-3 text-xs text-red-200 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <strong className="text-red-100">Planetary Deficit Alert:</strong> One or more inputs for this block (
                {inputs
                  .filter((inp) => deficitMap?.has(inp.id))
                  .map((inp) => `${inp.name} (-${deficitMap?.get(inp.id)?.deficitRate}/s)`)
                  .join(', ')}
                ) currently have a production shortfall across {planetId}.
              </div>
            </div>
          )}

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

            {inputs.length > 0 && (
              <button
                type="button"
                onClick={handleAnalyzeInAllocator}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-800/50 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="Open this block's input resources directly in the Train Station Allocator"
              >
                <Train className="w-3.5 h-3.5" />
                Analyze in Allocator
              </button>
            )}

            {initialBlock && onDuplicate && (
              <button
                type="button"
                onClick={() => {
                  onDuplicate(initialBlock.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-800/60 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="Create a shared copy of this block on this planet"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate (Shared)
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
          setIsIconManuallyEdited(true);
          setIconPickerOpen(false);
        }}
      />
    </div>
  );
};
