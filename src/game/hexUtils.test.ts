import { describe, it, expect } from 'vitest';
import { getHexNeighbors, hexDistance } from './hexUtils';

describe('hexUtils', () => {
  describe('getHexNeighbors', () => {
    it('should return correct neighbors for the origin (0, 0)', () => {
      const neighbors = getHexNeighbors({ q: 0, r: 0 });

      expect(neighbors).toHaveLength(6);
      expect(neighbors).toEqual(
        expect.arrayContaining([
          { q: 1, r: 0 },
          { q: 1, r: -1 },
          { q: 0, r: -1 },
          { q: -1, r: 0 },
          { q: -1, r: 1 },
          { q: 0, r: 1 },
        ])
      );
    });

    it('should return correct neighbors for a non-origin hex (1, 1)', () => {
      const neighbors = getHexNeighbors({ q: 1, r: 1 });

      expect(neighbors).toHaveLength(6);
      expect(neighbors).toEqual(
        expect.arrayContaining([
          { q: 2, r: 1 },
          { q: 2, r: 0 },
          { q: 1, r: 0 },
          { q: 0, r: 1 },
          { q: 0, r: 2 },
          { q: 1, r: 2 },
        ])
      );
    });

    it('should return correct neighbors for negative coordinates (-2, -3)', () => {
      const neighbors = getHexNeighbors({ q: -2, r: -3 });

      expect(neighbors).toHaveLength(6);
      expect(neighbors).toEqual(
        expect.arrayContaining([
          { q: -1, r: -3 },
          { q: -1, r: -4 },
          { q: -2, r: -4 },
          { q: -3, r: -3 },
          { q: -3, r: -2 },
          { q: -2, r: -2 },
        ])
      );
    });
  });

  describe('hexDistance', () => {
    it('should calculate distance 0 for the same hex', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
      expect(hexDistance({ q: 5, r: -2 }, { q: 5, r: -2 })).toBe(0);
    });

    it('should calculate distance 1 for neighbors', () => {
      const origin = { q: 0, r: 0 };
      const neighbors = getHexNeighbors(origin);
      for (const neighbor of neighbors) {
        expect(hexDistance(origin, neighbor)).toBe(1);
      }
    });

    it('should calculate distance correctly for arbitrary hexes', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 2 })).toBe(4);
      expect(hexDistance({ q: -1, r: 2 }, { q: 3, r: -1 })).toBe(4);
    });
  });
});
