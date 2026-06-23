import { describe, test } from 'node:test';
import assert from 'node:assert';
import { getTerrainProfile } from './terrain';

describe('terrain profiles', () => {
  test('are deterministic for the same hex', () => {
    assert.deepStrictEqual(getTerrainProfile(3, -2), getTerrainProfile(3, -2));
  });

  test('stay inside supported movement and elevation ranges', () => {
    for (let q = -8; q <= 8; q++) {
      for (let r = -8; r <= 8; r++) {
        const terrain = getTerrainProfile(q, r);
        assert.ok(terrain.elevation >= 0 && terrain.elevation <= 3);
        assert.ok(terrain.movementCost >= 1 && terrain.movementCost <= 3);
        assert.ok(['plains', 'forest', 'water', 'mountain'].includes(terrain.terrain));
      }
    }
  });
});
