import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  Train,
  Layers,
  Edit3,
  X,
  PackageOpen,
  ArrowRight,
  Move,
} from 'lucide-react';
import { FactorioIcon } from '../../../components/factorio/FactorioIcon';
import type { HexBlock, HexCoordinates, RawIngressNode, SpaceHubNode } from '../types.ts';
import {
  hexToPixel,
  hexKey,
  getHexPolygonPoints,
  calculateBoundingHexGrid,
} from '../core/hex-math.ts';

interface HexGridCanvasProps {
  blocks: HexBlock[];
  rawIngressNodes: RawIngressNode[];
  spaceHubs: SpaceHubNode[];
  onSelectBlock: (block: HexBlock) => void;
  onMoveBlock: (blockId: string, coordinates: HexCoordinates | null) => void;
  onNewBlockAt?: (coordinates: HexCoordinates) => void;
}

const HEX_RADIUS = 76; // Base size of hexagon

export const HexGridCanvas: React.FC<HexGridCanvasProps> = ({
  blocks,
  rawIngressNodes,
  spaceHubs,
  onSelectBlock,
  onMoveBlock,
  onNewBlockAt,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport transformation: pan (x, y) & zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Hover & selection states
  const [hoveredHex, setHoveredHex] = useState<HexCoordinates | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [movingBlockId, setMovingBlockId] = useState<string | null>(null);
  const [unplacedDrawerOpen, setUnplacedDrawerOpen] = useState(false);



  // Build maps of placed items by "q,r"
  const blockMap = useMemo(() => {
    const map = new Map<string, HexBlock>();
    for (const b of blocks) {
      if (b.coordinates) {
        map.set(hexKey(b.coordinates), b);
      }
    }
    return map;
  }, [blocks]);

  const rawMap = useMemo(() => {
    const map = new Map<string, RawIngressNode>();
    for (const r of rawIngressNodes) {
      if (r.coordinates) {
        map.set(hexKey(r.coordinates), r);
      }
    }
    return map;
  }, [rawIngressNodes]);

  const spaceMap = useMemo(() => {
    const map = new Map<string, SpaceHubNode>();
    for (const s of spaceHubs) {
      if (s.coordinates) {
        map.set(hexKey(s.coordinates), s);
      }
    }
    return map;
  }, [spaceHubs]);

  // All placed coordinates for bounding grid
  const allPlacedCoords = useMemo(() => {
    const coords: HexCoordinates[] = [];
    for (const b of blocks) if (b.coordinates) coords.push(b.coordinates);
    for (const r of rawIngressNodes) if (r.coordinates) coords.push(r.coordinates);
    for (const s of spaceHubs) if (s.coordinates) coords.push(s.coordinates);
    return coords;
  }, [blocks, rawIngressNodes, spaceHubs]);

  // Unplaced blocks
  const unplacedBlocks = useMemo(() => {
    return blocks.filter((b) => !b.coordinates);
  }, [blocks]);

  // Generate bounding grid hexes with padding
  const gridHexes = useMemo(() => {
    return calculateBoundingHexGrid(allPlacedCoords, 3);
  }, [allPlacedCoords]);

  // Center view on load
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setPan({ x: clientWidth / 2, y: clientHeight / 2 });
    }
  }, []);

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.4, zoom * zoomFactor));

    // Center zoom on mouse position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
      }));
    }
    setZoom(newZoom);
  };

  // Pan Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on left or middle click if not dragging a block
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleResetView = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setPan({ x: clientWidth / 2, y: clientHeight / 2 });
      setZoom(1);
    }
  };

  // Click on a Hex
  const handleHexClick = (hex: HexCoordinates) => {
    const key = hexKey(hex);
    const existingBlock = blockMap.get(key);

    // If we are currently moving or placing a block
    if (movingBlockId) {
      if (existingBlock && existingBlock.id !== movingBlockId) {
        // Swap or notify
        const moving = blocks.find((b) => b.id === movingBlockId);
        if (moving) {
          onMoveBlock(existingBlock.id, moving.coordinates);
          onMoveBlock(movingBlockId, hex);
        }
      } else {
        onMoveBlock(movingBlockId, hex);
      }
      setMovingBlockId(null);
      return;
    }

    if (existingBlock) {
      setSelectedBlockId(existingBlock.id);
    } else {
      // Empty hex clicked
      setSelectedBlockId(null);
      if (onNewBlockAt) {
        onNewBlockAt(hex);
      }
    }
  };

  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[680px] bg-[#0c0d11] border border-zinc-800 rounded-2xl overflow-hidden select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Background Blueprint Grid Lines Effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main SVG Hex Grid */}
      <svg className="w-full h-full block">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render Hexagon Lattice Tiles */}
          {gridHexes.map((hex) => {
            const key = hexKey(hex);
            const { x: cx, y: cy } = hexToPixel(hex, HEX_RADIUS);
            const points = getHexPolygonPoints(cx, cy, HEX_RADIUS - 2);

            const block = blockMap.get(key);
            const raw = rawMap.get(key);
            const space = spaceMap.get(key);

            const isHovered = hoveredHex && hoveredHex.q === hex.q && hoveredHex.r === hex.r;
            const isSelected = selectedBlock && selectedBlock.id === block?.id;
            const isTargetedForMove = movingBlockId !== null;

            return (
              <g
                key={key}
                onMouseEnter={() => setHoveredHex(hex)}
                onMouseLeave={() => setHoveredHex(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHexClick(hex);
                }}
                className="cursor-pointer transition-opacity"
              >
                {/* Hex Outline / Background */}
                <polygon
                  points={points}
                  fill={
                    block
                      ? block.color
                        ? `${block.color}15`
                        : '#1e2029'
                      : raw
                      ? '#271d0e'
                      : space
                      ? '#1e112a'
                      : isHovered
                      ? '#1f222e'
                      : '#111318'
                  }
                  stroke={
                    isSelected
                      ? '#ffffff'
                      : block
                      ? block.color || '#f97316'
                      : raw
                      ? '#f59e0b'
                      : space
                      ? '#c084fc'
                      : isHovered
                      ? '#f97316'
                      : '#232733'
                  }
                  strokeWidth={isSelected ? 3.5 : block || raw || space ? 2 : 1}
                  strokeDasharray={isSelected ? '6,3' : isTargetedForMove && !block ? '4,4' : undefined}
                  className="transition-colors duration-150"
                />

                {/* Placed Manufacturing Block Content */}
                {block && (
                  <foreignObject
                    x={cx - 56}
                    y={cy - 48}
                    width={112}
                    height={96}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-between p-1 text-center select-none">
                      {/* Top: Multiplier badge & Icon */}
                      <div className="flex items-center gap-1">
                        <FactorioIcon id={block.iconId} size={28} />
                        {block.blueprintMultiplier > 1 && (
                          <span className="text-[10px] font-mono px-1 py-0.2 bg-purple-950/80 border border-purple-700/60 text-purple-300 rounded font-bold">
                            {block.blueprintMultiplier}x
                          </span>
                        )}
                      </div>

                      {/* Middle: Block Name */}
                      <div className="text-[11px] font-bold text-zinc-100 truncate w-full px-1 drop-shadow-md">
                        {block.name}
                      </div>

                      {/* Bottom Pills: Trains/min & Station Bays */}
                      <div className="flex items-center gap-1 text-[9px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800 text-orange-400 font-semibold flex items-center gap-0.5">
                          <Train className="w-2.5 h-2.5" />
                          {(
                            block.inputs.reduce((s, f) => s + f.trainsPerMinute, 0) +
                            block.outputs.reduce((s, f) => s + f.trainsPerMinute, 0)
                          ).toFixed(1)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800 text-cyan-400 font-medium">
                          {block.inputs.reduce((s, f) => s + f.allocatedBays, 0) +
                            block.outputs.reduce((s, f) => s + f.allocatedBays, 0)}b
                        </span>
                      </div>
                    </div>
                  </foreignObject>
                )}

                {/* Placed Raw Mining Ingress Node */}
                {raw && !block && (
                  <foreignObject
                    x={cx - 50}
                    y={cy - 45}
                    width={100}
                    height={90}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-center">
                      <FactorioIcon id={raw.resourceId} size={26} />
                      <span className="text-[10px] font-bold text-amber-300 truncate w-full px-1">
                        {raw.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 bg-zinc-950/80 px-1 rounded">
                        {(raw.ratePerMinute / 1000).toFixed(0)}k/m
                      </span>
                    </div>
                  </foreignObject>
                )}

                {/* Placed Space Logistics Hub */}
                {space && !block && !raw && (
                  <foreignObject
                    x={cx - 50}
                    y={cy - 45}
                    width={100}
                    height={90}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-center">
                      <FactorioIcon id={space.cargoResourceId} size={26} />
                      <span className="text-[10px] font-bold text-purple-300 truncate w-full px-1">
                        {space.name}
                      </span>
                      <span className="text-[9px] font-mono text-purple-400 bg-zinc-950/80 px-1 rounded">
                        {space.launchesPerMinute.toFixed(1)} launch/m
                      </span>
                    </div>
                  </foreignObject>
                )}

                {/* Empty Hex: Display Coordinate and Add Prompt on Hover */}
                {!block && !raw && !space && (
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fill={isHovered ? '#f97316' : '#3f4454'}
                    fontSize={isHovered ? 12 : 9}
                    fontFamily="monospace"
                    className="pointer-events-none transition-all select-none"
                  >
                    {isHovered ? `+ (${hex.q}, ${hex.r})` : `${hex.q},${hex.r}`}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Canvas Controls (Top-Right) */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-zinc-950/90 border border-zinc-800 rounded-xl p-1.5 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.4, z * 0.8))}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          title="Reset View"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Top-Left Banner: Network Layout Summary */}
      <div className="absolute top-4 left-4 flex items-center gap-3 bg-zinc-950/90 border border-zinc-800 rounded-xl px-3.5 py-2 shadow-xl backdrop-blur-md text-xs">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-orange-400" />
          <span className="text-zinc-300 font-semibold">
            {allPlacedCoords.length} Placed on Grid
          </span>
        </div>

        {unplacedBlocks.length > 0 && (
          <button
            type="button"
            onClick={() => setUnplacedDrawerOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 font-mono text-[11px] hover:bg-amber-900 transition cursor-pointer"
          >
            <PackageOpen className="w-3 h-3" />
            {unplacedBlocks.length} Unplaced
          </button>
        )}

        {movingBlockId && (
          <div className="flex items-center gap-1 text-purple-400 font-medium animate-pulse">
            <Move className="w-3.5 h-3.5" />
            <span>Click any hex to place block</span>
            <button
              type="button"
              onClick={() => setMovingBlockId(null)}
              className="ml-1 text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Selected Block Quick Actions Card (Bottom-Left) */}
      {selectedBlock && (
        <div className="absolute bottom-4 left-4 bg-zinc-950/95 border border-zinc-700 rounded-2xl p-4 shadow-2xl backdrop-blur-md w-80 animate-fade-in">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <FactorioIcon id={selectedBlock.iconId} size={32} />
              <div>
                <h4 className="font-bold text-zinc-100 text-sm">{selectedBlock.name}</h4>
                <div className="text-[11px] font-mono text-zinc-400">
                  Hex ({selectedBlock.coordinates?.q}, {selectedBlock.coordinates?.r})
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBlockId(null)}
              className="text-zinc-500 hover:text-zinc-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-semibold">
                Rail Traffic
              </span>
              <span className="font-mono text-orange-400 font-bold">
                {(
                  selectedBlock.inputs.reduce((s, f) => s + f.trainsPerMinute, 0) +
                  selectedBlock.outputs.reduce((s, f) => s + f.trainsPerMinute, 0)
                ).toFixed(2)}{' '}
                tr/m
              </span>
            </div>
            <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-semibold">
                Total Bays
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {selectedBlock.inputs.reduce((s, f) => s + f.allocatedBays, 0) +
                  selectedBlock.outputs.reduce((s, f) => s + f.allocatedBays, 0)}{' '}
                bays
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onSelectBlock(selectedBlock);
                setSelectedBlockId(null);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Configure
            </button>

            <button
              type="button"
              onClick={() => {
                setMovingBlockId(selectedBlock.id);
                setSelectedBlockId(null);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Relocate this block on the hex grid"
            >
              <Move className="w-3.5 h-3.5" />
              Move
            </button>

            <button
              type="button"
              onClick={() => {
                onMoveBlock(selectedBlock.id, null);
                setSelectedBlockId(null);
              }}
              className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-xs transition cursor-pointer"
              title="Send to unplaced inventory tray"
            >
              Unplace
            </button>
          </div>
        </div>
      )}

      {/* Unplaced Blocks Drawer (Slide-out from Right) */}
      {unplacedDrawerOpen && (
        <div className="absolute inset-y-0 right-0 w-80 bg-zinc-950/98 border-l border-zinc-800 p-4 flex flex-col shadow-2xl backdrop-blur-xl animate-fade-in z-20">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-zinc-100 text-sm">Unplaced Blocks ({unplacedBlocks.length})</h4>
            </div>
            <button
              type="button"
              onClick={() => setUnplacedDrawerOpen(false)}
              className="p-1 text-zinc-500 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {unplacedBlocks.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-8">
                All blocks are currently placed on the hex grid!
              </div>
            ) : (
              unplacedBlocks.map((b) => (
                <div
                  key={b.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <FactorioIcon id={b.iconId} size={28} />
                    <div>
                      <div className="font-bold text-zinc-200 text-xs">{b.name}</div>
                      <div className="text-[10px] text-zinc-500">
                        {b.inputs.length} in • {b.outputs.length} out
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMovingBlockId(b.id);
                      setUnplacedDrawerOpen(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-500/30 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Place <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
