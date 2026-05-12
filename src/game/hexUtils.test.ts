import { test, describe } from 'node:test';
import assert from 'node:assert';
import { hexDistance, getHexNeighbors } from './hexUtils.ts';
import type { Axial } from './hexUtils.ts';

describe('hexUtils', () => {
  describe('hexDistance', () => {
    test('distance between same hex is 0', () => {
      const a: Axial = { q: 0, r: 0 };
      assert.strictEqual(hexDistance(a, a), 0);
    });

    test('distance between adjacent hexes is 1', () => {
      const a: Axial = { q: 0, r: 0 };
      const neighbors: Axial[] = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
      ];
      for (const b of neighbors) {
        assert.strictEqual(hexDistance(a, b), 1);
      }
    });

    test('distance between distant hexes', () => {
      const a: Axial = { q: 0, r: 0 };
      const b: Axial = { q: 2, r: 2 };
      assert.strictEqual(hexDistance(a, b), 4);

      const c: Axial = { q: -2, r: 3 };
      const d: Axial = { q: 3, r: -1 };
      assert.strictEqual(hexDistance(c, d), 5);
    });

    test('distance is commutative', () => {
      const a: Axial = { q: -5, r: 7 };
      const b: Axial = { q: 4, r: -2 };
      assert.strictEqual(hexDistance(a, b), hexDistance(b, a));
    });

    test('handles negative coordinates correctly', () => {
      const a: Axial = { q: -3, r: -3 };
      const b: Axial = { q: -1, r: -1 };
      assert.strictEqual(hexDistance(a, b), 4);
    });
  });

  describe('getHexNeighbors', () => {
    test('returns exactly 6 neighbors', () => {
      const a: Axial = { q: 0, r: 0 };
      const neighbors = getHexNeighbors(a);
      assert.strictEqual(neighbors.length, 6);
    });

    test('all neighbors are at distance 1', () => {
      const a: Axial = { q: 2, r: -3 };
      const neighbors = getHexNeighbors(a);
      for (const n of neighbors) {
        assert.strictEqual(hexDistance(a, n), 1);
      }
    });
  });
});
