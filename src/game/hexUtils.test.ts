import { describe, it, expect } from 'vitest';
import { getHexNeighbors, Axial } from './hexUtils';

describe('getHexNeighbors', () => {
  it('should return exactly 6 neighbors', () => {
    const origin: Axial = { q: 0, r: 0 };
    const neighbors = getHexNeighbors(origin);
    expect(neighbors.length).toBe(6);
  });

  it('should return correct neighbors for origin (0, 0)', () => {
    const origin: Axial = { q: 0, r: 0 };
    const neighbors = getHexNeighbors(origin);
    const expectedNeighbors: Axial[] = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 }
    ];

    expect(neighbors).toEqual(expect.arrayContaining(expectedNeighbors));
  });

  it('should return correct neighbors for an arbitrary hex (5, -3)', () => {
    const origin: Axial = { q: 5, r: -3 };
    const neighbors = getHexNeighbors(origin);
    const expectedNeighbors: Axial[] = [
      { q: 6, r: -3 },
      { q: 6, r: -4 },
      { q: 5, r: -4 },
      { q: 4, r: -3 },
      { q: 4, r: -2 },
      { q: 5, r: -2 }
    ];

    expect(neighbors).toEqual(expect.arrayContaining(expectedNeighbors));
  });
});
