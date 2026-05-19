import assert from 'node:assert';
import { createMech, MECH_TEMPLATES } from './Mech.ts';
import type { MechType } from './types.ts';

function testCreateMech() {
  console.log('Running testCreateMech...');

  const id = 'mech-1';
  const type: MechType = 'light';
  const ownerId = 'player-1';
  const q = 1;
  const r = 2;

  const mech = createMech(id, type, ownerId, q, r);

  assert.strictEqual(mech.id, id);
  assert.strictEqual(mech.type, type);
  assert.strictEqual(mech.ownerId, ownerId);
  assert.strictEqual(mech.position.q, q);
  assert.strictEqual(mech.position.r, r);
  assert.deepStrictEqual(mech.stats, MECH_TEMPLATES.light);
  assert.strictEqual(mech.isDestroyed, false);
  assert.strictEqual(mech.hasMoved, false);
  assert.strictEqual(mech.hasAttacked, false);
  assert.strictEqual(mech.rotation, 0);

  // Test that stats are a copy, not a reference
  mech.stats.hp = 0;
  assert.notStrictEqual(MECH_TEMPLATES.light.hp, 0);
  assert.strictEqual(MECH_TEMPLATES.light.hp, 50);

  console.log('testCreateMech passed!');
}

function testCreateMechDifferentTypes() {
    console.log('Running testCreateMechDifferentTypes...');

    const types: MechType[] = ['light', 'medium', 'heavy'];
    types.forEach(type => {
        const mech = createMech('id', type, 'owner', 0, 0);
        assert.strictEqual(mech.type, type);
        assert.deepStrictEqual(mech.stats, MECH_TEMPLATES[type]);
    });

    console.log('testCreateMechDifferentTypes passed!');
}

try {
  testCreateMech();
  testCreateMechDifferentTypes();
  console.log('All tests passed!');
} catch (error) {
  console.error('Tests failed!');
  console.error(error);
  process.exit(1);
}
