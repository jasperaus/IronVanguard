import { test, describe } from 'node:test';
import assert from 'node:assert';
import { applyDamage } from './Combat.ts';
import type { MechInstance } from './types.ts';

describe('applyDamage', () => {
  const createBaseMech = (): MechInstance => ({
    id: 'test-mech',
    type: 'medium',
    ownerId: 'player-1',
    stats: {
      hp: 10,
      maxHp: 10,
      armor: 10,
      maxArmor: 10,
      movement: 4,
      range: 3,
      damage: 5,
      heat: 0,
      maxHeat: 10,
    },
    position: { q: 0, r: 0 },
    rotation: 0,
    isDestroyed: false,
    hasMoved: false,
    hasAttacked: false,
  });

  test('should absorb damage with armor first', () => {
    const mech = createBaseMech();
    const result = applyDamage(mech, 4);

    assert.strictEqual(result.stats.armor, 6, 'Armor should be reduced by 4');
    assert.strictEqual(result.stats.hp, 10, 'HP should remain unchanged');
    assert.strictEqual(result.isDestroyed, false, 'Mech should not be destroyed');
  });

  test('should carry over damage to HP when armor is depleted', () => {
    const mech = createBaseMech();
    const result = applyDamage(mech, 14);

    assert.strictEqual(result.stats.armor, 0, 'Armor should be completely depleted');
    assert.strictEqual(result.stats.hp, 6, 'Remaining 4 damage should be taken from HP');
    assert.strictEqual(result.isDestroyed, false, 'Mech should not be destroyed');
  });

  test('should mark mech as destroyed when HP reaches 0', () => {
    const mech = createBaseMech();
    const result = applyDamage(mech, 25);

    assert.strictEqual(result.stats.armor, 0, 'Armor should be completely depleted');
    assert.strictEqual(result.stats.hp, 0, 'HP should be reduced to 0');
    assert.strictEqual(result.isDestroyed, true, 'Mech should be marked as destroyed');
  });

  test('should handle damage when armor is already 0', () => {
    const mech = createBaseMech();
    mech.stats.armor = 0;

    const result = applyDamage(mech, 5);

    assert.strictEqual(result.stats.armor, 0, 'Armor should remain 0');
    assert.strictEqual(result.stats.hp, 5, 'All damage should be taken from HP');
    assert.strictEqual(result.isDestroyed, false, 'Mech should not be destroyed');
  });

  test('should not mutate the original mech object', () => {
    const mech = createBaseMech();
    const mechCopy = JSON.parse(JSON.stringify(mech));

    applyDamage(mech, 5);

    assert.deepStrictEqual(mech, mechCopy, 'Original mech object should not be mutated');
  });
});
