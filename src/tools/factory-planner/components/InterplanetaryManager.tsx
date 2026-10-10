import React, { useState } from 'react';
import {
  Rocket,
  Satellite,
  Plus,
  ArrowRight,
  Trash2,
  Edit3,
  ShieldCheck,
  Orbit,
} from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import type {
  FactoryPlannerProject,
  InterplanetaryRoute,
  SpacePlatform,
  SolidPlanetId,
} from '../types';
import { PLANETS_META } from '../types';
import { SpacePlatformModal } from './SpacePlatformModal';
import { InterplanetaryRouteModal } from './InterplanetaryRouteModal';
import { calculateInterplanetaryRoute } from '../core/calculations';

interface InterplanetaryManagerProps {
  project: FactoryPlannerProject;
  onUpsertRoute: (route: InterplanetaryRoute) => void;
  onRemoveRoute: (routeId: string) => void;
  onUpsertPlatform: (platform: SpacePlatform) => void;
  onRemovePlatform: (platformId: string) => void;
}

export const InterplanetaryManager: React.FC<InterplanetaryManagerProps> = ({
  project,
  onUpsertRoute,
  onRemoveRoute,
  onUpsertPlatform,
  onRemovePlatform,
}) => {
  const routes = project.interplanetaryRoutes || [];
  const platforms = project.spacePlatforms || [];

  // Modals state
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<SpacePlatform | null>(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<InterplanetaryRoute | null>(null);

  // Filter state
  const [filterPlanet, setFilterPlanet] = useState<string>('all');

  // Aggregated Stats
  const totalLaunchesPerMin = routes.reduce((sum, r) => sum + r.launchesPerMinute, 0);
  const totalSilosRequired = routes.reduce((sum, r) => sum + r.silosRequired, 0);
  const totalOrbitalScience = platforms.reduce(
    (sum, p) =>
      sum +
      p.producedScience.reduce(
        (s, sci) => s + (sci.ratePerSecond ?? (sci.ratePerMinute ? sci.ratePerMinute / 60 : 0)),
        0
      ),
    0
  );

  const filteredRoutes = routes.filter((r) => {
    if (filterPlanet === 'all') return true;
    return r.sourcePlanet === filterPlanet || r.targetPlanet === filterPlanet;
  });

  const getPlanetMeta = (id: SolidPlanetId | 'platform') => {
    if (id === 'platform') {
      return {
        name: 'Space Platform Orbit',
        accentColor: '#a855f7',
      };
    }
    return PLANETS_META[id] || { name: id, accentColor: '#71717a' };
  };

  const handleEditPlatform = (platform: SpacePlatform) => {
    setEditingPlatform(platform);
    setPlatformModalOpen(true);
  };

  const handleNewPlatform = () => {
    setEditingPlatform(null);
    setPlatformModalOpen(true);
  };

  const handleEditRoute = (route: InterplanetaryRoute) => {
    setEditingRoute(route);
    setRouteModalOpen(true);
  };

  const handleNewRoute = () => {
    setEditingRoute(null);
    setRouteModalOpen(true);
  };

  // Add standard science presets if empty or wanted
  const handleAddStandardScienceRoutes = () => {
    const standardRoutes = [
      {
        id: `route-std-vulcanus-${Date.now()}`,
        sourcePlanet: 'vulcanus' as const,
        targetPlanet: 'nauvis' as const,
        sourceHubName: 'Vulcanus Foundry Silo',
        targetHubName: 'Nauvis Central Landing Pad',
        resourceId: 'metallurgic-science-pack',
        ratePerSecond: 16.67,
      },
      {
        id: `route-std-gleba-${Date.now()}`,
        sourcePlanet: 'gleba' as const,
        targetPlanet: 'nauvis' as const,
        sourceHubName: 'Gleba Bio-Silo Pad',
        targetHubName: 'Nauvis Central Landing Pad',
        resourceId: 'agricultural-science-pack',
        ratePerSecond: 16.67,
      },
      {
        id: `route-std-fulgora-${Date.now()}`,
        sourcePlanet: 'fulgora' as const,
        targetPlanet: 'nauvis' as const,
        sourceHubName: 'Fulgora EM Nexus',
        targetHubName: 'Nauvis Central Landing Pad',
        resourceId: 'electromagnetic-science-pack',
        ratePerSecond: 16.67,
      },
      {
        id: `route-std-aquilo-${Date.now()}`,
        sourcePlanet: 'aquilo' as const,
        targetPlanet: 'nauvis' as const,
        sourceHubName: 'Aquilo Cryo Silo',
        targetHubName: 'Nauvis Central Landing Pad',
        resourceId: 'cryogenic-science-pack',
        ratePerSecond: 16.67,
      },
    ];

    standardRoutes.forEach((sr) => {
      const calc = calculateInterplanetaryRoute({
        cargoResourceId: sr.resourceId,
        ratePerSecond: sr.ratePerSecond,
      });
      onUpsertRoute({
        ...sr,
        weightPerItemKg: calc.weightPerItemKg,
        capacityPerRocket: calc.capacityPerRocket,
        launchesPerMinute: calc.launchesPerMinute,
        silosRequired: calc.silosRequired,
        notes: 'Standard Space Age interplanetary science delivery',
      });
    });
  };

  // Solar system body coordinates for the visual map
  const solarBodies: Array<{
    id: SolidPlanetId | 'platform' | 'shattered';
    name: string;
    orbitX: number;
    orbitY: number;
    color: string;
    radius: number;
  }> = [
    { id: 'vulcanus', name: 'Vulcanus', orbitX: 110, orbitY: 90, color: '#ef4444', radius: 18 },
    { id: 'nauvis', name: 'Nauvis', orbitX: 250, orbitY: 90, color: '#22c55e', radius: 24 },
    { id: 'platform', name: 'Nauvis Orbit', orbitX: 250, orbitY: 35, color: '#a855f7', radius: 10 },
    { id: 'gleba', name: 'Gleba', orbitX: 410, orbitY: 90, color: '#84cc16', radius: 20 },
    { id: 'fulgora', name: 'Fulgora', orbitX: 570, orbitY: 90, color: '#eab308', radius: 21 },
    { id: 'aquilo', name: 'Aquilo', orbitX: 730, orbitY: 90, color: '#06b6d4', radius: 19 },
    { id: 'shattered', name: 'Shattered Planet', orbitX: 880, orbitY: 90, color: '#ec4899', radius: 16 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-zinc-950 border border-purple-800/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-purple-900/20 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-purple-900/60 rounded-xl border border-purple-700/60 text-purple-300">
                <Rocket className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  Space Age Interplanetary Logistics & Orbital Fleet
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Factorio 2.1 interplanetary trade routes, orbital science platforms, and Legendary Rocket Silos (+150% launch speed, 1,000 kg cargo payloads).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleNewPlatform}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Satellite className="w-4 h-4" />
              + Launch Platform
            </button>
            <button
              type="button"
              onClick={handleNewRoute}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + New Trade Route
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <div className="text-[11px] text-zinc-500 uppercase font-medium">
              Trade Routes
            </div>
            <div className="text-xl font-bold font-mono text-zinc-100 mt-0.5">
              {routes.length}
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <div className="text-[11px] text-zinc-500 uppercase font-medium">
              Space Platforms
            </div>
            <div className="text-xl font-bold font-mono text-purple-300 mt-0.5">
              {platforms.length}
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <div className="text-[11px] text-zinc-500 uppercase font-medium">
              Rocket Launches
            </div>
            <div className="text-xl font-bold font-mono text-orange-400 mt-0.5">
              {totalLaunchesPerMin.toFixed(2)}
              <span className="text-xs text-zinc-500 font-normal ml-1">/min</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <div className="text-[11px] text-zinc-500 uppercase font-medium">
              Orbital Science
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
              {totalOrbitalScience.toFixed(1)}
              <span className="text-xs text-zinc-500 font-normal ml-1">/s</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-purple-900/60 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-purple-400 uppercase font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Legendary Silos
            </div>
            <div className="text-xl font-bold font-mono text-purple-200 mt-0.5">
              {totalSilosRequired}
              <span className="text-xs text-zinc-400 font-normal ml-1">silos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Solar System Visual Schematic */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-semibold text-zinc-200">
            <Orbit className="w-4 h-4 text-purple-400" />
            Solar System Orbital Network & Trade Routes
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Interactive routing across Vulcanus, Nauvis, Gleba, Fulgora, Aquilo & Orbit
          </span>
        </div>

        <div className="w-full overflow-x-auto bg-black/40 rounded-xl border border-zinc-900 p-2">
          <svg viewBox="0 0 980 160" className="w-full min-w-[750px] h-36">
            <defs>
              <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Sun indicator at far left */}
            <circle cx="10" cy="90" r="45" fill="#f59e0b" opacity="0.15" />
            <circle cx="10" cy="90" r="30" fill="#f59e0b" opacity="0.3" />

            {/* Orbital plane baseline */}
            <line
              x1="60"
              y1="90"
              x2="950"
              y2="90"
              stroke="#27272a"
              strokeDasharray="4,4"
              strokeWidth="1.5"
            />

            {/* Active route curved arcs */}
            {routes.map((route, idx) => {
              const srcBody = solarBodies.find(
                (b) => b.id === (route.sourcePlanet === 'platform' ? 'platform' : route.sourcePlanet)
              );
              const tgtBody = solarBodies.find(
                (b) => b.id === (route.targetPlanet === 'platform' ? 'platform' : route.targetPlanet)
              );
              if (!srcBody || !tgtBody) return null;

              const dx = tgtBody.orbitX - srcBody.orbitX;
              const midX = (srcBody.orbitX + tgtBody.orbitX) / 2;
              const arcHeight = Math.min(65, Math.max(25, Math.abs(dx) * 0.12));
              const midY = 90 - arcHeight - (idx % 3) * 6;

              return (
                <g key={route.id} className="cursor-pointer group">
                  <path
                    d={`M ${srcBody.orbitX} ${srcBody.orbitY} Q ${midX} ${midY} ${tgtBody.orbitX} ${tgtBody.orbitY}`}
                    fill="none"
                    stroke="url(#route-gradient)"
                    strokeWidth="2.5"
                    strokeDasharray="6,4"
                    opacity="0.75"
                  />
                  {/* Midpoint route cargo indicator */}
                  <circle
                    cx={midX}
                    cy={midY}
                    r="5"
                    fill="#a855f7"
                    className="animate-pulse"
                  />
                </g>
              );
            })}

            {/* Planetary Bodies */}
            {solarBodies.map((body) => (
              <g key={body.id} className="cursor-pointer">
                {/* Orbit aura */}
                <circle
                  cx={body.orbitX}
                  cy={body.orbitY}
                  r={body.radius + 6}
                  fill={body.color}
                  opacity="0.12"
                />
                {/* Body circle */}
                <circle
                  cx={body.orbitX}
                  cy={body.orbitY}
                  r={body.radius}
                  fill={body.color}
                  stroke="#18181b"
                  strokeWidth="2"
                />
                {/* Label */}
                <text
                  x={body.orbitX}
                  y={body.orbitY + body.radius + 14}
                  textAnchor="middle"
                  fill="#d4d4d8"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {body.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Space Platforms Fleet Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-zinc-100 text-sm">
              Space Platforms Fleet ({platforms.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={handleNewPlatform}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
          >
            + Add Platform
          </button>
        </div>

        {platforms.length === 0 ? (
          <div className="p-8 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-center space-y-2">
            <Satellite className="w-8 h-8 mx-auto text-zinc-600" />
            <div className="text-zinc-300 text-sm font-semibold">
              No Space Platforms Deployed
            </div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Deploy orbital platforms to process asteroids into Space Science and Promethium Science packs.
            </p>
            <button
              type="button"
              onClick={handleNewPlatform}
              className="mt-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Deploy First Platform
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-800/60 rounded-xl p-4 transition shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-950/70 border border-purple-800/60 rounded-lg text-purple-400">
                      <Satellite className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-100 text-sm leading-tight">
                        {platform.name}
                      </h4>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-950 text-purple-300 border border-purple-900/50 mt-1 capitalize">
                        {platform.currentOrbit.replace(/-/g, ' ')} orbit
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditPlatform(platform)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                      title="Edit Platform"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePlatform(platform.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                      title="Decommission Platform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Science Output */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">
                    Orbital Science Production:
                  </div>
                  {platform.producedScience.length === 0 ? (
                    <span className="text-xs text-zinc-500 italic">No science outputs configured</span>
                  ) : (
                    <div className="space-y-1">
                      {platform.producedScience.map((sci) => (
                        <div
                          key={sci.resourceId}
                          className="flex items-center justify-between p-1.5 bg-zinc-950/80 rounded-lg border border-zinc-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FactorioIcon id={sci.resourceId} size={20} />
                            <span className="text-zinc-200 capitalize">
                              {sci.resourceId.replace(/-/g, ' ')}
                            </span>
                          </div>
                          <span className="font-mono font-semibold text-purple-300">
                            {(sci.ratePerSecond ?? (sci.ratePerMinute ? sci.ratePerMinute / 60 : 0)).toFixed(1)}/s
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {platform.notes && (
                  <div className="text-xs text-zinc-400 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/60 leading-relaxed">
                    {platform.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interplanetary Trade Routes Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-zinc-100 text-sm">
              Interplanetary Cargo Trade Routes ({routes.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {routes.length === 0 && (
              <button
                type="button"
                onClick={handleAddStandardScienceRoutes}
                className="px-3 py-1 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/60 text-purple-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add Standard Space Age Science Routes
              </button>
            )}

            {/* Filter by Planet */}
            <select
              value={filterPlanet}
              onChange={(e) => setFilterPlanet(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="nauvis">Nauvis</option>
              <option value="vulcanus">Vulcanus</option>
              <option value="gleba">Gleba</option>
              <option value="fulgora">Fulgora</option>
              <option value="aquilo">Aquilo</option>
              <option value="platform">Space Platform</option>
            </select>

            <button
              type="button"
              onClick={handleNewRoute}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Route
            </button>
          </div>
        </div>

        {filteredRoutes.length === 0 ? (
          <div className="p-8 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-center space-y-2">
            <Rocket className="w-8 h-8 mx-auto text-zinc-600" />
            <div className="text-zinc-300 text-sm font-semibold">
              No Interplanetary Routes Configured
            </div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Connect planetary rocket silos to orbital platforms and cargo landing pads to deliver science packs and rare raw minerals.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleAddStandardScienceRoutes}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Load Standard Science Routes
              </button>
              <button
                type="button"
                onClick={handleNewRoute}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Create Custom Route
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRoutes.map((route) => {
              const srcMeta = getPlanetMeta(route.sourcePlanet);
              const tgtMeta = getPlanetMeta(route.targetPlanet);

              return (
                <div
                  key={route.id}
                  className="bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-800/50 rounded-xl p-4 transition shadow-xs space-y-3"
                >
                  {/* Origin -> Destination Banner */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {/* Origin */}
                      <span
                        className="px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 bg-zinc-950 border text-zinc-200"
                        style={{ borderColor: srcMeta.accentColor }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: srcMeta.accentColor }}
                        />
                        <span className="capitalize">{srcMeta.name}</span>
                      </span>

                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />

                      {/* Destination */}
                      <span
                        className="px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 bg-zinc-950 border text-zinc-200"
                        style={{ borderColor: tgtMeta.accentColor }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tgtMeta.accentColor }}
                        />
                        <span className="capitalize">{tgtMeta.name}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditRoute(route)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                        title="Edit Route"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveRoute(route.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                        title="Delete Route"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cargo & Logistics Detail Box */}
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
                          <FactorioIcon id={route.resourceId} size={26} />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-200 text-xs capitalize">
                            {route.resourceId.replace(/-/g, ' ')}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {route.sourceHubName} → {route.targetHubName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-purple-300">
                          {route.ratePerSecond.toLocaleString()}
                          <span className="text-zinc-500 text-xs font-normal ml-0.5">/s</span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {route.weightPerItemKg.toFixed(2)} kg/item
                        </div>
                      </div>
                    </div>

                    {/* Silo Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center">
                      <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/60">
                        <div className="text-[10px] text-zinc-500 uppercase font-medium">
                          Rocket Load
                        </div>
                        <div className="font-mono text-zinc-200 font-semibold text-xs mt-0.5">
                          {route.capacityPerRocket.toLocaleString()} items
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/60">
                        <div className="text-[10px] text-zinc-500 uppercase font-medium">
                          Launches
                        </div>
                        <div className="font-mono text-orange-400 font-semibold text-xs mt-0.5">
                          {route.launchesPerMinute.toFixed(2)}/min
                        </div>
                      </div>

                      <div className="bg-purple-950/40 p-1.5 rounded-lg border border-purple-800/50">
                        <div className="text-[10px] text-purple-400 uppercase font-medium">
                          Legendary Silos
                        </div>
                        <div className="font-mono text-purple-200 font-bold text-xs mt-0.5">
                          {route.silosRequired} Silo{route.silosRequired > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {route.notes && (
                    <div className="text-[11px] text-zinc-400 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/60">
                      {route.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <SpacePlatformModal
        isOpen={platformModalOpen}
        onClose={() => setPlatformModalOpen(false)}
        onSave={onUpsertPlatform}
        initialPlatform={editingPlatform}
      />

      <InterplanetaryRouteModal
        isOpen={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
        onSave={onUpsertRoute}
        initialRoute={editingRoute}
      />
    </div>
  );
};
