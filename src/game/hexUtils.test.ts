import assert from 'node:assert';
import test from 'node:test';
import { getHexNeighbors } from './hexUtils.ts';

test('getHexNeighbors returns 6 adjacent hexes for origin', () => {
    const center = { q: 0, r: 0 };
    const neighbors = getHexNeighbors(center);

    assert.strictEqual(neighbors.length, 6, 'Should return exactly 6 neighbors');

    const expected = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    assert.deepStrictEqual(neighbors, expected);
});

test('getHexNeighbors returns 6 adjacent hexes for arbitrary coordinates', () => {
    const center = { q: -2, r: 5 };
    const neighbors = getHexNeighbors(center);

    assert.strictEqual(neighbors.length, 6, 'Should return exactly 6 neighbors');

    const expected = [
        { q: -1, r: 5 }, { q: -1, r: 4 }, { q: -2, r: 4 },
        { q: -3, r: 5 }, { q: -3, r: 6 }, { q: -2, r: 6 }
    ];

    assert.deepStrictEqual(neighbors, expected);
});
