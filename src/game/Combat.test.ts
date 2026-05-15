import test from 'node:test';
import assert from 'node:assert';
import { calculateDamage } from './Combat';
import { MechInstance } from './types';

function createMockMech(
  id: string,
  damage: number,
  range: number,
  q: number,
  r: number
): MechInstance {
  return {
    id,
    type: 'medium',
    ownerId: 'player1',
    stats: {
      hp: 10,
      maxHp: 10,
      armor: 5,
      maxArmor: 5,
      movement: 3,
      range,
      damage,
      heat: 0,
      maxHeat: 10,
    },
    position: { q, r },
    rotation: 0,
    isDestroyed: false,
    hasMoved: false,
    hasAttacked: false,
  };
}

test('calculateDamage', async (t) => {
  await t.test('applies full damage when within range', () => {
    const attacker = createMockMech('attacker', 10, 3, 0, 0);
    const defender = createMockMech('defender', 10, 3, 0, 2);
    // hexDistance((0,0), (0,2)) is 2, range is 3. Within range.
    assert.strictEqual(calculateDamage(attacker, defender), 10);
  });

  await t.test('applies half damage when out of range', () => {
    const attacker = createMockMech('attacker', 10, 2, 0, 0);
    const defender = createMockMech('defender', 10, 2, 0, 3);
    // hexDistance((0,0), (0,3)) is 3, range is 2. Out of range.
    assert.strictEqual(calculateDamage(attacker, defender), 5);
  });

  await t.test('does not return negative damage', () => {
    const attacker = createMockMech('attacker', 0, 2, 0, 0);
    const defender = createMockMech('defender', 10, 2, 0, 3);
    assert.strictEqual(calculateDamage(attacker, defender), 0);

    // Test negative base damage just to be sure (though arguably this shouldn't happen, calculateDamage has Math.max(0, damage))
    const weakAttacker = createMockMech('attacker', -5, 2, 0, 0);
    assert.strictEqual(calculateDamage(weakAttacker, defender), 0);
  });

  await t.test('works for hex distance correctly', () => {
     // A distance of 1
     const attacker = createMockMech('attacker', 10, 1, 0, 0);
     const defender = createMockMech('defender', 10, 1, 1, 0);
     assert.strictEqual(calculateDamage(attacker, defender), 10);

     // A distance of 2 (out of range, range 1)
     const outOfRangeDefender = createMockMech('defender', 10, 1, 2, 0);
     assert.strictEqual(calculateDamage(attacker, outOfRangeDefender), 5);
  });
});
