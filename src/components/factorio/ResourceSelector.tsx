import React, { useState, useMemo } from 'react';
import { Search, X, Droplet, Box, Sparkles } from 'lucide-react';
import { getAllItems, getAllFluids } from '../../lib/factorio';
import type { FactorioItem, FactorioFluid } from '../../data/generated/types';

interface ResourceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (resource: FactorioItem | FactorioFluid) => void;
  selectedIds?: string[];
}

type FilterCategory = 'all' | 'items' | 'fluids' | 'space-age';

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedIds = [],
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');

  const allItems = useMemo(() => getAllItems(), []);
  const allFluids = useMemo(() => getAllFluids(), []);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    let pool: (FactorioItem | FactorioFluid)[] = [];
    if (category === 'all') {
      pool = [...allItems, ...allFluids];
    } else if (category === 'items') {
      pool = allItems;
    } else if (category === 'fluids') {
      pool = allFluids;
    } else if (category === 'space-age') {
      // Space Age specific subgroups / keywords
      pool = [...allItems, ...allFluids].filter(
        r =>
          r.subgroup.includes('space') ||
          r.subgroup.includes('vulcanus') ||
          r.subgroup.includes('gleba') ||
          r.subgroup.includes('fulgora') ||
          r.subgroup.includes('aquilo') ||
          r.id.includes('calcite') ||
          r.id.includes('tungsten') ||
          r.id.includes('holmium') ||
          r.id.includes('promethium') ||
          r.id.includes('cryogenic') ||
          r.id.includes('metallurgic') ||
          r.id.includes('agricultural') ||
          r.id.includes('electromagnetic')
      );
    }

    if (!query) {
      return pool;
    }

    return pool.filter(
      r =>
        r.name.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        r.subgroup.toLowerCase().includes(query)
    );
  }, [allItems, allFluids, search, category]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div 
        className="relative w-full max-w-2xl bg-[#16191f] border border-[#2d333f] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d333f] bg-[#121418]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-lg text-slate-100">Select Resource</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              Factorio 2.1
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-[#22262e] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-[#2d333f] space-y-3 bg-[#181b22]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search items, fluids, or materials (e.g. Iron plate, Calcite, Petroleum gas)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0e1014] border border-[#2d333f] focus:border-amber-500 focus:outline-none rounded-lg text-slate-200 placeholder-slate-500 text-sm font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'items', label: 'Items only' },
                { id: 'fluids', label: 'Fluids only' },
                { id: 'space-age', label: 'Space Age' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  category === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-[#22262e] text-slate-300 hover:bg-[#2d333f]'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="text-xs text-slate-500 ml-auto font-mono">
              {filteredResources.length} results
            </span>
          </div>
        </div>

        {/* Resource List */}
        <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
          {filteredResources.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-500">
              No matching resources found for "{search}"
            </div>
          ) : (
            filteredResources.map(resource => {
              const isSelected = selectedIds.includes(resource.id);
              const isFluid = resource.type === 'fluid';

              return (
                <button
                  key={resource.id}
                  disabled={isSelected}
                  onClick={() => {
                    onSelect(resource);
                    onClose();
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition ${
                    isSelected
                      ? 'border-[#232832] bg-[#121418] opacity-50 cursor-not-allowed'
                      : 'border-[#2d333f] bg-[#1a1d24] hover:bg-[#22262e] hover:border-amber-500/50 cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
                      isFluid
                        ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400'
                        : 'bg-amber-950/40 border-amber-800/40 text-amber-400'
                    }`}
                  >
                    {isFluid ? <Droplet className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-slate-200 truncate">
                      {resource.name}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="truncate">{resource.subgroup}</span>
                      {!isFluid && (
                        <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          stack: {(resource as FactorioItem).stackSize}
                        </span>
                      )}
                      {isFluid && (
                        <span className="text-[11px] font-mono text-cyan-400/90 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                          fluid
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-xs text-slate-500 shrink-0 font-medium">Added</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2d333f] bg-[#121418] flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Filter by "Space Age" for Vulcanus, Gleba, and Fulgora resources.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-[#22262e] text-slate-200 hover:bg-[#2d333f] font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
