import { describe, it, expect } from 'vitest';
import { getHexNeighbors } from './hexUtils';

describe('hexUtils', () => {
  describe('getHexNeighbors', () => {
    it('should return 6 correct neighbors for origin (0,0)', () => {
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

    it('should return 6 correct neighbors for an arbitrary hex (2, 3)', () => {
      const neighbors = getHexNeighbors({ q: 2, r: 3 });
      expect(neighbors).toHaveLength(6);
      expect(neighbors).toEqual(
        expect.arrayContaining([
          { q: 3, r: 3 },
          { q: 3, r: 2 },
          { q: 2, r: 2 },
          { q: 1, r: 3 },
          { q: 1, r: 4 },
          { q: 2, r: 4 },
        ])
      );
    });
  });
});
