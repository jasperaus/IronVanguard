import { describe, it, expect } from 'vitest';
import { getHexNeighbors } from './hexUtils';

describe('getHexNeighbors', () => {
  it('should return correct neighbors for the origin (0, 0)', () => {
    const origin = { q: 0, r: 0 };
    const expectedNeighbors = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 }
    ];

    const neighbors = getHexNeighbors(origin);

    expect(neighbors).toHaveLength(6);
    expect(neighbors).toEqual(expect.arrayContaining(expectedNeighbors));
  });

  it('should return correct neighbors for a positive coordinate (2, 3)', () => {
    const hex = { q: 2, r: 3 };
    const expectedNeighbors = [
      { q: 3, r: 3 },
      { q: 3, r: 2 },
      { q: 2, r: 2 },
      { q: 1, r: 3 },
      { q: 1, r: 4 },
      { q: 2, r: 4 }
    ];

    const neighbors = getHexNeighbors(hex);

    expect(neighbors).toHaveLength(6);
    expect(neighbors).toEqual(expect.arrayContaining(expectedNeighbors));
  });

  it('should return correct neighbors for a negative coordinate (-1, -1)', () => {
    const hex = { q: -1, r: -1 };
    const expectedNeighbors = [
      { q: 0, r: -1 },
      { q: 0, r: -2 },
      { q: -1, r: -2 },
      { q: -2, r: -1 },
      { q: -2, r: 0 },
      { q: -1, r: 0 }
    ];

    const neighbors = getHexNeighbors(hex);

    expect(neighbors).toHaveLength(6);
    expect(neighbors).toEqual(expect.arrayContaining(expectedNeighbors));
  });
});
