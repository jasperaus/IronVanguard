import { describe, it, expect } from 'vitest';
import { getHexNeighbors } from './hexUtils';
import type { Axial } from './hexUtils';

describe('getHexNeighbors', () => {
  it('should return exactly 6 neighbors for the origin', () => {
    const origin: Axial = { q: 0, r: 0 };
    const neighbors = getHexNeighbors(origin);

    expect(neighbors).toHaveLength(6);
    expect(neighbors).toEqual(
      expect.arrayContaining([
        { q: 1, r: 0 },
        { q: 1, r: -1 },
        { q: 0, r: -1 },
        { q: -1, r: 0 },
        { q: -1, r: 1 },
        { q: 0, r: 1 }
      ])
    );
  });

  it('should return exactly 6 neighbors for an arbitrary hex', () => {
    const arbitraryHex: Axial = { q: 2, r: -3 };
    const neighbors = getHexNeighbors(arbitraryHex);

    expect(neighbors).toHaveLength(6);
    expect(neighbors).toEqual(
      expect.arrayContaining([
        { q: 3, r: -3 }, // 2+1, -3+0
        { q: 3, r: -4 }, // 2+1, -3-1
        { q: 2, r: -4 }, // 2+0, -3-1
        { q: 1, r: -3 }, // 2-1, -3+0
        { q: 1, r: -2 }, // 2-1, -3+1
        { q: 2, r: -2 }  // 2+0, -3+1
      ])
    );
  });
});
