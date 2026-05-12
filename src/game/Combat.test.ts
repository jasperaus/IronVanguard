import test from 'node:test';
import assert from 'node:assert';
import { calculateDamage } from './Combat';
import { MechInstance } from './types';

// Helper to create a basic mock MechInstance
function createMockMech(id: string, damage: number, range: number, q: number, r: number): MechInstance {
  return {
    id,
    type: 'medium',
    ownerId: 'player1',
    stats: {
      hp: 100,
      maxHp: 100,
      armor: 50,
      maxArmor: 50,
      movement: 4,
      range,
      damage,
      heat: 0,
      maxHeat: 30,
    },
    position: { q, r },
    rotation: 0,
    isDestroyed: false,
    hasMoved: false,
    hasAttacked: false,
  };
}

test('calculateDamage - target within range', (t) => {
  const attacker = createMockMech('attacker', 20, 5, 0, 0);
  const defender = createMockMech('defender', 10, 5, 0, 3); // distance 3

  const damage = calculateDamage(attacker, defender);
  assert.strictEqual(damage, 20);
});

test('calculateDamage - target exactly at max range', (t) => {
  const attacker = createMockMech('attacker', 20, 5, 0, 0);
  const defender = createMockMech('defender', 10, 5, 0, 5); // distance 5

  const damage = calculateDamage(attacker, defender);
  assert.strictEqual(damage, 20);
});

test('calculateDamage - target out of range', (t) => {
  const attacker = createMockMech('attacker', 20, 5, 0, 0);
  const defender = createMockMech('defender', 10, 5, 0, 6); // distance 6, > 5

  const damage = calculateDamage(attacker, defender);
  assert.strictEqual(damage, 10); // 20 * 0.5
});

test('calculateDamage - attacker with 0 damage', (t) => {
  const attacker = createMockMech('attacker', 0, 5, 0, 0);
  const defender = createMockMech('defender', 10, 5, 0, 3);

  const damage = calculateDamage(attacker, defender);
  assert.strictEqual(damage, 0);
});

test('calculateDamage - attacker with negative damage', (t) => {
  const attacker = createMockMech('attacker', -10, 5, 0, 0);
  const defender = createMockMech('defender', 10, 5, 0, 3);

  const damage = calculateDamage(attacker, defender);
  assert.strictEqual(damage, 0); // Math.max(0, -10)
});
