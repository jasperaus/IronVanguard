import type { MechInstance } from './types.ts';

export function calculateDamage(attacker: MechInstance, defender: MechInstance): number {
  // Simple damage calculation for now
  // In a real BattleTech game, this would involve hit locations, armor vs structure, etc.
  let damage = attacker.stats.damage;
  
  // Range penalty
  const dist = hexDistance(attacker.position, defender.position);
  if (dist > attacker.stats.range) {
    damage *= 0.5;
  }
  
  return Math.max(0, damage);
}

function hexDistance(a: { q: number; r: number }, b: { q: number; r: number }): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function applyDamage(mech: MechInstance, damage: number): MechInstance {
  const newMech = { ...mech, stats: { ...mech.stats } };
  
  if (newMech.stats.armor > 0) {
    const armorDamage = Math.min(newMech.stats.armor, damage);
    newMech.stats.armor -= armorDamage;
    damage -= armorDamage;
  }
  
  if (damage > 0) {
    newMech.stats.hp -= damage;
  }
  
  if (newMech.stats.hp <= 0) {
    newMech.isDestroyed = true;
    newMech.stats.hp = 0;
  }
  
  return newMech;
}
