import React from 'react';
import { PLANETS_META, type SolidPlanetId, type PlanetFactoryState } from '../types';

interface PlanetSwitcherProps {
  activePlanet: SolidPlanetId;
  onSelectPlanet: (planetId: SolidPlanetId) => void;
  planets: Record<SolidPlanetId, PlanetFactoryState>;
  isSpaceActive?: boolean;
  onSelectSpace?: () => void;
  routeCount?: number;
}

export const PlanetSwitcher: React.FC<PlanetSwitcherProps> = ({
  activePlanet,
  onSelectPlanet,
  planets,
  isSpaceActive = false,
  onSelectSpace,
  routeCount = 0,
}) => {
  const planetList: SolidPlanetId[] = ['nauvis', 'vulcanus', 'gleba', 'fulgora', 'aquilo'];

  return (
    <div className="flex items-center gap-2 p-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-x-auto">
      {planetList.map((id) => {
        const meta = PLANETS_META[id];
        const state = planets[id];
        const isActive = !isSpaceActive && activePlanet === id;
        const blockCount = state?.blocks.length || 0;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectPlanet(id)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
              isActive
                ? 'bg-zinc-800 text-white shadow-md'
                : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-transparent'
            }`}
            style={{
              borderColor: isActive ? meta.accentColor : 'transparent',
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: meta.accentColor }}
            />
            <span className="capitalize">{meta.name}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive
                  ? 'bg-zinc-900 text-zinc-200 border border-zinc-700'
                  : 'bg-zinc-900/60 text-zinc-500'
              }`}
            >
              {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
            </span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-px h-6 bg-zinc-800 mx-1 shrink-0" />

      {/* Space & Interplanetary Logistics Button */}
      {onSelectSpace && (
        <button
          type="button"
          onClick={onSelectSpace}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
            isSpaceActive
              ? 'bg-purple-950/80 text-purple-200 border-purple-600 shadow-md'
              : 'bg-transparent text-purple-400/80 hover:text-purple-300 hover:bg-purple-950/30 border-transparent'
          }`}
        >
          <span className="text-sm">🛰️</span>
          <span>Space Logistics</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              isSpaceActive
                ? 'bg-purple-900 text-purple-200 border border-purple-700'
                : 'bg-zinc-900/60 text-purple-400/70'
            }`}
          >
            {routeCount} {routeCount === 1 ? 'route' : 'routes'}
          </span>
        </button>
      )}
    </div>
  );
};
