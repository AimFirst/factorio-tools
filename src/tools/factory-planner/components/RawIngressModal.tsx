import React, { useState, useEffect } from 'react';
import { X, Mountain, Check, Trash2, MapPin } from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import { ResourceSelector } from '../../../components/factorio/ResourceSelector';
import type { RawIngressNode, SolidPlanetId, HexCoordinates } from '../types';
import type { FactorioItem, FactorioFluid } from '../../../data/generated/types';

interface RawIngressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: RawIngressNode) => void;
  onDelete?: (id: string) => void;
  initialNode?: RawIngressNode | null;
  planetId: SolidPlanetId;
}

export const RawIngressModal: React.FC<RawIngressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialNode,
  planetId,
}) => {
  const [name, setName] = useState('Ore Outpost Depot');
  const [resourceId, setResourceId] = useState('iron-ore');
  const [ratePerSecond, setRatePerSecond] = useState(400);
  const [coordinates, setCoordinates] = useState<HexCoordinates | null>(null);
  const [hasCoordinates, setHasCoordinates] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialNode) {
        setName(initialNode.name);
        setResourceId(initialNode.resourceId);
        setRatePerSecond(initialNode.ratePerSecond);
        setCoordinates(initialNode.coordinates);
        setHasCoordinates(!!initialNode.coordinates);
        setNotes(initialNode.notes || '');
      } else {
        setName('Ore Outpost Depot');
        setResourceId('iron-ore');
        setRatePerSecond(400);
        setCoordinates(null);
        setHasCoordinates(false);
        setNotes('');
      }
    }
  }, [isOpen, initialNode]);

  if (!isOpen) return null;

  const handleSave = () => {
    const node: RawIngressNode = {
      id: initialNode ? initialNode.id : `raw-${planetId}-${Date.now()}`,
      resourceId,
      planetId,
      name: name.trim() || 'Raw Ingress Depot',
      ratePerSecond: Math.max(0, ratePerSecond),
      ratePerMinute: Math.max(0, ratePerSecond) * 60,
      coordinates: hasCoordinates ? (coordinates || { q: 0, r: 0 }) : null,
      notes: notes.trim() || undefined,
    };
    onSave(node);
    onClose();
  };

  const handleDelete = () => {
    if (initialNode && onDelete) {
      if (window.confirm(`Are you sure you want to delete mining outpost "${initialNode.name}"?`)) {
        onDelete(initialNode.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Mountain className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-zinc-100 text-base">
              {initialNode ? 'Edit Mining Outpost' : 'Add Mining Outpost Ingress'}
            </h3>
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

          {/* Optional Coordinates Placement on Hex Grid */}
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Hex Map Coordinates
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCoordinates}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasCoordinates(checked);
                    if (checked && !coordinates) {
                      setCoordinates({ q: 0, r: 0 });
                    }
                  }}
                  className="rounded bg-zinc-900 border-zinc-700 text-orange-500 focus:ring-0 cursor-pointer"
                />
                Place on Grid
              </label>
            </div>

            {hasCoordinates && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Axial Q (Column)</label>
                  <input
                    type="number"
                    value={coordinates?.q ?? 0}
                    onChange={(e) =>
                      setCoordinates((prev) => ({
                        q: parseInt(e.target.value, 10) || 0,
                        r: prev?.r ?? 0,
                      }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Axial R (Row)</label>
                  <input
                    type="number"
                    value={coordinates?.r ?? 0}
                    onChange={(e) =>
                      setCoordinates((prev) => ({
                        q: prev?.q ?? 0,
                        r: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50M ore patch, 8-wagon loading station..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          {initialNode && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Delete this outpost"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Outpost
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
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
              {initialNode ? 'Save Changes' : 'Add Outpost'}
            </button>
          </div>
        </div>
      </div>

      <ResourceSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(res: FactorioItem | FactorioFluid) => {
          setResourceId(res.id);
          if (!initialNode || name === 'Ore Outpost Depot' || name.endsWith('Outpost')) {
            setName(`${res.name} Outpost`);
          }
          setSelectorOpen(false);
        }}
      />
    </div>
  );
};

