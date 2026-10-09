/**
 * Hexagonal Grid Mathematics for Factorio City Blocks
 * Orientation: Horizontal top and bottom edges, pointy sides (W/E).
 * 6 Borders: Top, Bottom, Top-Left, Top-Right, Bottom-Left, Bottom-Right.
 */

import type { HexCoordinates, CubeCoordinates } from '../types';

/**
 * Neighbor deltas in axial coordinates (q, r):
 * - North: (0, -1)   -> shares Top border
 * - South: (0, +1)   -> shares Bottom border
 * - NorthEast: (+1, -1) -> shares Top-Right border
 * - SouthEast: (+1, 0)  -> shares Bottom-Right border
 * - NorthWest: (-1, 0)  -> shares Top-Left border
 * - SouthWest: (-1, +1) -> shares Bottom-Left border
 */
export const HEX_DIRECTIONS: Record<string, HexCoordinates> = {
  NORTH: { q: 0, r: -1 },
  SOUTH: { q: 0, r: 1 },
  NORTH_EAST: { q: 1, r: -1 },
  SOUTH_EAST: { q: 1, r: 0 },
  NORTH_WEST: { q: -1, r: 0 },
  SOUTH_WEST: { q: -1, r: 1 },
};

export const HEX_DIRECTION_LIST: HexCoordinates[] = Object.values(HEX_DIRECTIONS);

export function axialToCube(hex: HexCoordinates): CubeCoordinates {
  const x = hex.q;
  const z = hex.r;
  const y = -x - z;
  return { x, y, z };
}

export function cubeToAxial(cube: CubeCoordinates): HexCoordinates {
  return { q: cube.x, r: cube.z };
}

/**
 * Returns the hex grid distance (number of block hops) between two coordinates.
 */
export function hexDistance(a: HexCoordinates, b: HexCoordinates): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return (Math.abs(ac.x - bc.x) + Math.abs(ac.y - bc.y) + Math.abs(ac.z - bc.z)) / 2;
}

/**
 * Get all 6 immediate neighbors of a hex.
 */
export function getHexNeighbors(hex: HexCoordinates): HexCoordinates[] {
  return HEX_DIRECTION_LIST.map((dir) => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
  }));
}

/**
 * Unique string key for map/set lookups: "q,r"
 */
export function hexKey(hex: HexCoordinates): string {
  return `${hex.q},${hex.r}`;
}

export function parseHexKey(key: string): HexCoordinates {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/**
 * Computes 2D pixel center coordinates for an axial hex (q, r).
 * Radius R is the distance from center to vertices.
 */
export function hexToPixel(
  hex: HexCoordinates,
  radius: number
): { x: number; y: number } {
  // Horizontal distance between column centers: 1.5 * radius
  const x = radius * 1.5 * hex.q;
  // Vertical distance: sqrt(3) * radius * (r + q / 2)
  const y = radius * Math.sqrt(3) * (hex.r + hex.q / 2);
  return { x, y };
}

/**
 * Converts screen pixel (x, y) back to nearest axial hex coordinate.
 */
export function pixelToHex(
  x: number,
  y: number,
  radius: number
): HexCoordinates {
  const qFraction = ((2 / 3) * x) / radius;
  const rFraction = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / radius;

  // Cube rounding
  const xCube = qFraction;
  const zCube = rFraction;
  const yCube = -xCube - zCube;

  let rx = Math.round(xCube);
  let ry = Math.round(yCube);
  let rz = Math.round(zCube);

  const xDiff = Math.abs(rx - xCube);
  const yDiff = Math.abs(ry - yCube);
  const zDiff = Math.abs(rz - zCube);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}

/**
 * Returns the SVG polygon points string for a hexagon centered at (cx, cy) with radius R.
 * Generates horizontal top/bottom edges and pointy side vertices.
 */
export function getHexPolygonPoints(
  cx: number,
  cy: number,
  radius: number
): string {
  const points: [number, number][] = [];
  // 6 vertices at angles: 0, 60, 120, 180, 240, 300 degrees
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    const px = cx + radius * Math.cos(angleRad);
    const py = cy + radius * Math.sin(angleRad);
    points.push([px, py]);
  }
  return points.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`).join(' ');
}

/**
 * Generates all hex coordinates within a radial distance R from the origin.
 */
export function generateHexGridRadius(radius: number): HexCoordinates[] {
  const results: HexCoordinates[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({ q, r });
    }
  }
  return results;
}

/**
 * Generates a padded bounding grid covering all placed coordinates.
 */
export function calculateBoundingHexGrid(
  coords: HexCoordinates[],
  padding: number = 2
): HexCoordinates[] {
  if (coords.length === 0) {
    return generateHexGridRadius(padding);
  }

  let minQ = Infinity;
  let maxQ = -Infinity;
  let minR = Infinity;
  let maxR = -Infinity;

  for (const c of coords) {
    if (c.q < minQ) minQ = c.q;
    if (c.q > maxQ) maxQ = c.q;
    if (c.r < minR) minR = c.r;
    if (c.r > maxR) maxR = c.r;
  }

  minQ -= padding;
  maxQ += padding;
  minR -= padding;
  maxR += padding;

  const results: HexCoordinates[] = [];
  for (let q = minQ; q <= maxQ; q++) {
    for (let r = minR; r <= maxR; r++) {
      results.push({ q, r });
    }
  }
  return results;
}

