export type MechType = 'light' | 'medium' | 'heavy';

export interface MechStats {
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  movement: number;
  range: number;
  damage: number;
  heat: number;
  maxHeat: number;
}

export interface MechInstance {
  id: string;
  type: MechType;
  ownerId: string;
  stats: MechStats;
  position: { q: number; r: number }; // Hex coordinates
  rotation: number;
  isDestroyed: boolean;
  hasMoved: boolean;
  hasAttacked: boolean;
}

export interface GameState {
  id: string;
  players: string[];
  mechs: MechInstance[];
  turn: number;
  activePlayerId: string;
  status: 'waiting' | 'playing' | 'finished';
  winnerId?: string;
}

export interface HexCell {
  q: number;
  r: number;
  terrain: 'plains' | 'forest' | 'water' | 'mountain';
  elevation: number;
}
