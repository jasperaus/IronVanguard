import type { MechInstance, MechStats, MechType } from './types';

export const MECH_TEMPLATES: Record<MechType, MechStats> = {
  light: {
    hp: 50, maxHp: 50,
    armor: 20, maxArmor: 20,
    movement: 6,
    range: 4,
    damage: 10,
    heat: 0, maxHeat: 100
  },
  medium: {
    hp: 100, maxHp: 100,
    armor: 50, maxArmor: 50,
    movement: 4,
    range: 6,
    damage: 20,
    heat: 0, maxHeat: 100
  },
  heavy: {
    hp: 200, maxHp: 200,
    armor: 100, maxArmor: 100,
    movement: 2,
    range: 8,
    damage: 40,
    heat: 0, maxHeat: 100
  }
};

export function createMech(id: string, type: MechType, ownerId: string, q: number, r: number): MechInstance {
  return {
    id,
    type,
    ownerId,
    stats: { ...MECH_TEMPLATES[type] },
    position: { q, r },
    rotation: 0,
    isDestroyed: false,
    hasMoved: false,
    hasAttacked: false
  };
}
