import { test, describe } from 'node:test';
import assert from 'node:assert';
import { pixelToHex, hexToPixel } from './hexUtils.ts';

describe('hexUtils - pixelToHex', () => {
  test('converts origin pixel to hex (0, 0)', () => {
    const size = 10;
    const hex = pixelToHex(0, 0, size);
    assert.deepStrictEqual(hex, { q: 0, r: 0 });
  });

  test('reverses hexToPixel accurately', () => {
    const size = 20;
    const testCases = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 0 },
      { q: 0, r: -1 },
      { q: 1, r: -1 },
      { q: -1, r: 1 },
      { q: 5, r: 5 },
      { q: -5, r: 5 },
      { q: 5, r: -5 },
      { q: -5, r: -5 },
    ];

    for (const testCase of testCases) {
      const pixel = hexToPixel(testCase.q, testCase.r, size);
      const hex = pixelToHex(pixel.x, pixel.y, size);
      // normalize -0 to 0 to avoid strict equal issues
      if (Object.is(hex.q, -0)) hex.q = 0;
      if (Object.is(hex.r, -0)) hex.r = 0;
      assert.deepStrictEqual(hex, testCase);
    }
  });

  test('handles points slightly off-center (rounding correctly)', () => {
    const size = 10;
    const center = hexToPixel(1, 1, size);

    // Slightly offset points still inside the same hex
    const points = [
      { x: center.x + 1, y: center.y + 1 },
      { x: center.x - 1, y: center.y - 1 },
      { x: center.x + 4, y: center.y },
      { x: center.x - 4, y: center.y },
      { x: center.x, y: center.y + 4 },
      { x: center.x, y: center.y - 4 },
    ];

    for (const p of points) {
      const hex = pixelToHex(p.x, p.y, size);
      if (Object.is(hex.q, -0)) hex.q = 0;
      if (Object.is(hex.r, -0)) hex.r = 0;
      assert.deepStrictEqual(hex, { q: 1, r: 1 });
    }
  });

  test('handles points near hex boundaries', () => {
    const size = 10;

    // Near boundary to q=1, r=0 (center is x=15, y=8.66)
    // The midpoint between (0,0) and (1,0) is x=7.5, y=4.33

    // Point closer to 0,0
    const hex1 = pixelToHex(7.4, 4.2, size);
    if (Object.is(hex1.q, -0)) hex1.q = 0;
    if (Object.is(hex1.r, -0)) hex1.r = 0;
    assert.deepStrictEqual(hex1, { q: 0, r: 0 });

    // Point closer to 1,0
    const hex2 = pixelToHex(7.6, 4.4, size);
    if (Object.is(hex2.q, -0)) hex2.q = 0;
    if (Object.is(hex2.r, -0)) hex2.r = 0;
    assert.deepStrictEqual(hex2, { q: 1, r: 0 });
  });
});
