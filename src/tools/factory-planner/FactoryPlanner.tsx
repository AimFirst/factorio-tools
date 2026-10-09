import React, { useState } from 'react';
import {
  Train,
  Plus,
  Rocket,
  Mountain,
  Layers,
  Loader2,
  Map as MapIcon,
  LayoutGrid,
  Columns2,
} from 'lucide-react';
import { useFactoryPlanner } from './hooks/useFactoryPlanner.ts';
import { PLANETS_META, type HexBlock, type HexCoordinates } from './types.ts';
import { PlanetSwitcher } from './components/PlanetSwitcher';
import { ProjectActionsBar } from './components/ProjectActionsBar';
import { BlockCard } from './components/BlockCard';
import { HexGridCanvas } from './components/HexGridCanvas';
import { BlockEditorModal } from './components/BlockEditorModal';
import { RawIngressModal } from './components/RawIngressModal';
import { SpaceHubModal } from './components/SpaceHubModal';
import { InterplanetaryManager } from './components/InterplanetaryManager';
import { FactorioIcon } from '../../components/factorio/FactorioIcon';
import { createDefaultProject } from './storage/starterProject';

export const FactoryPlanner: React.FC = () => {
  const {
    project,
    activePlanet,
    activePlanetState,
    setActivePlanet,
    isLoading,
    isSaving,
    upsertBlock,
    removeBlock,
    moveBlock,
    upsertRawIngress,
    upsertSpaceHub,
    upsertInterplanetaryRoute,
    removeInterplanetaryRoute,
    upsertSpacePlatform,
    removeSpacePlatform,
    exportProjectJson,
    importProjectJson,
    updateProject,
  } = useFactoryPlanner();

  // View & Modals state
  const [isSpaceView, setIsSpaceView] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'cards' | 'split'>('map');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<HexBlock | null>(null);
  const [newBlockCoords, setNewBlockCoords] = useState<HexCoordinates | null>(null);
  const [rawModalOpen, setRawModalOpen] = useState(false);
  const [spaceModalOpen, setSpaceModalOpen] = useState(false);

  if (isLoading || !project || !activePlanetState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm font-medium">Loading Multi-World Factory Planner...</span>
      </div>
    );
  }

  const planetMeta = PLANETS_META[activePlanet];
  const blocks = activePlanetState.blocks;
  const rawIngressNodes = activePlanetState.rawIngressNodes;
  const spaceHubs = activePlanetState.spaceHubs;

  // Planetary Metrics
  const totalPlanetTrains = blocks.reduce((sum, b) => {
    const inp = b.inputs.reduce((s, f) => s + f.trainsPerMinute, 0);
    const out = b.outputs.reduce((s, f) => s + f.trainsPerMinute, 0);
    return sum + inp + out;
  }, 0);

  const totalStationBays = blocks.reduce((sum, b) => {
    const inp = b.inputs.reduce((s, f) => s + f.allocatedBays, 0);
    const out = b.outputs.reduce((s, f) => s + f.allocatedBays, 0);
    return sum + inp + out;
  }, 0);

  const totalRocketLaunches = spaceHubs.reduce((sum, h) => sum + h.launchesPerMinute, 0);

  const handleOpenNewBlock = (coords?: HexCoordinates) => {
    setEditingBlock(null);
    setNewBlockCoords(coords || null);
    setEditorOpen(true);
  };

  const handleEditBlock = (block: HexBlock) => {
    setEditingBlock(block);
    setNewBlockCoords(null);
    setEditorOpen(true);
  };

  const handleExport = () => {
    const json = exportProjectJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-v2.1.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetStarter = () => {
    const starter = createDefaultProject();
    updateProject(() => starter);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Top Actions Bar */}
      <ProjectActionsBar
        project={project}
        activePlanet={activePlanet}
        isSaving={isSaving}
        onNewBlock={handleOpenNewBlock}
        onAddRawIngress={() => setRawModalOpen(true)}
        onAddSpaceHub={() => setSpaceModalOpen(true)}
        onExportJson={handleExport}
        onImportJson={importProjectJson}
        onResetStarter={handleResetStarter}
      />

      {/* Planet Switcher Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PlanetSwitcher
          activePlanet={activePlanet}
          onSelectPlanet={(id) => {
            setIsSpaceView(false);
            setActivePlanet(id);
          }}
          planets={project.planets}
          isSpaceActive={isSpaceView}
          onSelectSpace={() => setIsSpaceView(true)}
          routeCount={project.interplanetaryRoutes?.length || 0}
        />

        {/* Planet Quick Tag */}
        {!isSpaceView && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: planetMeta.accentColor }}
            />
            <span className="font-semibold text-zinc-200">{planetMeta.name}:</span>
            <span>{planetMeta.tagline}</span>
          </div>
        )}
      </div>

      {isSpaceView ? (
        <InterplanetaryManager
          project={project}
          onUpsertRoute={upsertInterplanetaryRoute}
          onRemoveRoute={removeInterplanetaryRoute}
          onUpsertPlatform={upsertSpacePlatform}
          onRemovePlatform={removeSpacePlatform}
        />
      ) : (
        <>
          {/* Planetary Overview Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Blocks */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
              Factory Blocks
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-100 mt-0.5">
              {blocks.length}
            </div>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-orange-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Total Train Traffic */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
              Rail Traffic
            </div>
            <div className="text-2xl font-bold font-mono text-orange-400 mt-0.5">
              {totalPlanetTrains.toFixed(1)}
              <span className="text-xs text-zinc-500 font-normal ml-1">tr/m</span>
            </div>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-orange-400">
            <Train className="w-5 h-5" />
          </div>
        </div>

        {/* Total Station Bays */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
              Loading/Unloading Bays
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">
              {totalStationBays}
            </div>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-cyan-400">
            <Train className="w-5 h-5" />
          </div>
        </div>

        {/* Space Rocket Launches */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
              Rocket Silo Launches
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-0.5">
              {totalRocketLaunches.toFixed(2)}
              <span className="text-xs text-zinc-500 font-normal ml-1">/m</span>
            </div>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-purple-400">
            <Rocket className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Blocks Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-zinc-100">
              {planetMeta.name} Manufacturing Blocks ({blocks.length})
            </h3>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Hexagonal Rail City Blocks
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-zinc-800 text-orange-400 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Hex Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-zinc-800 text-orange-400 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Block Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-zinc-800 text-orange-400 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                Split
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewBlock()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Block
            </button>
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'map' && (
          <HexGridCanvas
            blocks={blocks}
            rawIngressNodes={rawIngressNodes}
            spaceHubs={spaceHubs}
            onSelectBlock={handleEditBlock}
            onMoveBlock={(id, coords) => moveBlock(activePlanet, id, coords)}
            onNewBlockAt={handleOpenNewBlock}
          />
        )}

        {viewMode === 'cards' && (
          <div>
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800/80 rounded-2xl bg-zinc-950/40 text-center gap-3">
                <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-500">
                  <Layers className="w-8 h-8" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-base font-semibold text-zinc-200">
                    No factory blocks on {planetMeta.name} yet
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Start by creating your first hexagonal city block on {planetMeta.name} to plan
                    its inputs, outputs, and train traffic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenNewBlock()}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create First Block
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blocks.map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    onEdit={handleEditBlock}
                    onDelete={(id) => removeBlock(activePlanet, id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <HexGridCanvas
                blocks={blocks}
                rawIngressNodes={rawIngressNodes}
                spaceHubs={spaceHubs}
                onSelectBlock={handleEditBlock}
                onMoveBlock={(id, coords) => moveBlock(activePlanet, id, coords)}
                onNewBlockAt={handleOpenNewBlock}
              />
            </div>
            <div className="lg:col-span-4 space-y-3 max-h-[680px] overflow-y-auto pr-1">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
                Planet Block Roster ({blocks.length})
              </div>
              {blocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  onEdit={handleEditBlock}
                  onDelete={(id) => removeBlock(activePlanet, id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Perimeter Ingress Outposts & Space Logistics Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/80">
        {/* Outposts (Raw Ingress) */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-zinc-200">
                Mining Outposts & Raw Ingress ({rawIngressNodes.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setRawModalOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              + Add Outpost
            </button>
          </div>

          {rawIngressNodes.length === 0 ? (
            <div className="text-xs text-zinc-500 p-4 text-center border border-dashed border-zinc-800/60 rounded-xl">
              No raw mining depots configured for this planet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rawIngressNodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FactorioIcon id={node.resourceId} size={24} />
                    <div>
                      <div className="font-medium text-zinc-200">{node.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {node.ratePerMinute.toLocaleString()}/min ({(node.ratePerMinute / 60).toFixed(0)}/s)
                      </div>
                    </div>
                  </div>
                  {node.coordinates && (
                    <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                      ({node.coordinates.q},{node.coordinates.r})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Space Logistics Hubs (Silos & Landing Pads) */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-zinc-200">
                Space Logistics & Legendary Silos ({spaceHubs.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSpaceModalOpen(true)}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
            >
              + Add Silo Hub
            </button>
          </div>

          {spaceHubs.length === 0 ? (
            <div className="text-xs text-zinc-500 p-4 text-center border border-dashed border-zinc-800/60 rounded-xl">
              No rocket silos or orbital landing pads configured for this planet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {spaceHubs.map((hub) => (
                <div
                  key={hub.id}
                  className="flex items-center justify-between p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FactorioIcon id={hub.cargoResourceId} size={24} />
                    <div>
                      <div className="font-medium text-zinc-200 flex items-center gap-1.5">
                        <span>{hub.name}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                          {hub.type === 'rocket-silo' ? 'Silo' : 'Pad'}
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-400/90 font-mono">
                        {hub.launchesPerMinute.toFixed(2)} launches/min
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate max-w-[80px]" title={hub.targetPlatformOrPlanet}>
                    → {hub.targetPlatformOrPlanet}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Modals */}
      <BlockEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={(block) => upsertBlock(activePlanet, block)}
        onDelete={(id) => removeBlock(activePlanet, id)}
        initialBlock={editingBlock}
        initialCoordinates={newBlockCoords}
        planetId={activePlanet}
      />

      <RawIngressModal
        isOpen={rawModalOpen}
        onClose={() => setRawModalOpen(false)}
        onSave={(node) => upsertRawIngress(activePlanet, node)}
        planetId={activePlanet}
      />

      <SpaceHubModal
        isOpen={spaceModalOpen}
        onClose={() => setSpaceModalOpen(false)}
        onSave={(hub) => upsertSpaceHub(activePlanet, hub)}
        planetId={activePlanet}
      />
    </div>
  );
};
