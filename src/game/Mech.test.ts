import test from 'node:test';
import assert from 'node:assert';
import { createMech, MECH_TEMPLATES } from './Mech';

test('createMech should create a light mech correctly', () => {
  const mech = createMech('mech-1', 'light', 'player-1', 2, 3);

  assert.strictEqual(mech.id, 'mech-1');
  assert.strictEqual(mech.type, 'light');
  assert.strictEqual(mech.ownerId, 'player-1');
  assert.deepStrictEqual(mech.position, { q: 2, r: 3 });
  assert.strictEqual(mech.rotation, 0);
  assert.strictEqual(mech.isDestroyed, false);
  assert.strictEqual(mech.hasMoved, false);
  assert.strictEqual(mech.hasAttacked, false);

  assert.deepStrictEqual(mech.stats, MECH_TEMPLATES['light']);
});

test('createMech should create a medium mech correctly', () => {
  const mech = createMech('mech-2', 'medium', 'player-2', -1, 5);

  assert.strictEqual(mech.id, 'mech-2');
  assert.strictEqual(mech.type, 'medium');
  assert.deepStrictEqual(mech.stats, MECH_TEMPLATES['medium']);
  assert.deepStrictEqual(mech.position, { q: -1, r: 5 });
});

test('createMech should create a heavy mech correctly', () => {
  const mech = createMech('mech-3', 'heavy', 'player-1', 0, 0);

  assert.strictEqual(mech.id, 'mech-3');
  assert.strictEqual(mech.type, 'heavy');
  assert.deepStrictEqual(mech.stats, MECH_TEMPLATES['heavy']);
  assert.deepStrictEqual(mech.position, { q: 0, r: 0 });
});

test('createMech should create a copy of the stats, not a reference', () => {
  const mech = createMech('mech-4', 'light', 'player-2', 1, 1);

  // Modify the mech's stats
  mech.stats.hp = 10;

  // Verify the template was not modified
  assert.strictEqual(MECH_TEMPLATES['light'].hp, 50);
});
