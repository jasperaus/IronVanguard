import { describe, test } from 'node:test';
import assert from 'node:assert';
import { TERRAIN_ELEVATION_STEP, getReachableTerrainHexes, getTerrainElevationOffset, getTerrainProfile, toHexKey } from './terrain';

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

  test('calculates reachable hexes using terrain movement costs', () => {
    const reachable = getReachableTerrainHexes({ q: -5, r: 1 }, 2);

    assert.ok(reachable.has(toHexKey({ q: -5, r: 1 })));
    assert.ok(reachable.has(toHexKey({ q: -4, r: 1 })));
    assert.ok(!reachable.has(toHexKey({ q: -3, r: 2 })));
  });

  test('derives visual elevation offsets from terrain elevation', () => {
    const terrain = getTerrainProfile(0, 0);

    assert.strictEqual(getTerrainElevationOffset(0, 0), terrain.elevation * -TERRAIN_ELEVATION_STEP);
  });
});
