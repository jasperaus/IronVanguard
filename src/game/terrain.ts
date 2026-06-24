import { HexCell } from './types';
import { Axial, getHexNeighbors, hexDistance } from './hexUtils';

export interface TerrainProfile extends HexCell {
  color: number;
  edgeColor: number;
  movementCost: number;
  defenseBonus: number;
  label: string;
}

export const TERRAIN_ELEVATION_STEP = 4;

export function getTerrainProfile(q: number, r: number): TerrainProfile {
  const elevation = getElevation(q, r);
  const noise = seededNoise(q, r);
  const ridge = Math.abs(q + r) % 7 === 0;

  if (ridge || elevation >= 3) {
    return {
      q,
      r,
      terrain: 'mountain',
      elevation,
      color: 0x3d4752,
      edgeColor: 0x8ba3b8,
      movementCost: 3,
      defenseBonus: 2,
      label: 'Ridge',
    };
  }

  if (noise < 0.18) {
    return {
      q,
      r,
      terrain: 'water',
      elevation: 0,
      color: 0x0b3b56,
      edgeColor: 0x2aa9d6,
      movementCost: 2,
      defenseBonus: 0,
      label: 'Water',
    };
  }

  if (noise > 0.72) {
    return {
      q,
      r,
      terrain: 'forest',
      elevation,
      color: 0x214d35,
      edgeColor: 0x4fba72,
      movementCost: 2,
      defenseBonus: 1,
      label: 'Forest',
    };
  }

  return {
    q,
    r,
    terrain: 'plains',
    elevation,
    color: 0x26323d,
    edgeColor: 0x597184,
    movementCost: 1,
    defenseBonus: 0,
    label: 'Plain',
  };
}

export function getTerrainElevationOffset(q: number, r: number): number {
  return getTerrainProfile(q, r).elevation * -TERRAIN_ELEVATION_STEP;
}

export function getReachableTerrainHexes(
  start: Axial,
  movement: number,
  blockedHexes = new Set<string>(),
  boardRadius = 8
): Map<string, number> {
  const costs = new Map<string, number>();
  const frontier: { hex: Axial; cost: number }[] = [{ hex: start, cost: 0 }];
  costs.set(toHexKey(start), 0);

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost);
    const current = frontier.shift();
    if (!current) break;

    for (const neighbor of getHexNeighbors(current.hex)) {
      const key = toHexKey(neighbor);
      if (blockedHexes.has(key) || hexDistance({ q: 0, r: 0 }, neighbor) > boardRadius) continue;

      const nextCost = current.cost + getTerrainProfile(neighbor.q, neighbor.r).movementCost;
      if (nextCost > movement) continue;

      const previousCost = costs.get(key);
      if (previousCost === undefined || nextCost < previousCost) {
        costs.set(key, nextCost);
        frontier.push({ hex: neighbor, cost: nextCost });
      }
    }
  }

  return costs;
}

export function toHexKey(hex: Axial): string {
  return `${hex.q},${hex.r}`;
}

function getElevation(q: number, r: number): number {
  const hill = Math.sin(q * 0.75) + Math.cos(r * 0.65) + Math.sin((q + r) * 0.35);
  return Math.max(0, Math.min(3, Math.round(hill + 1.2)));
}

function seededNoise(q: number, r: number): number {
  const value = Math.sin(q * 127.1 + r * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}
