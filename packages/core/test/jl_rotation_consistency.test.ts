import { describe, it, expect } from 'vitest';
import { TETROMINO_SHAPES } from '../src/pieces/tetromino';

function rotateCW(p: { x: number; y: number }) {
  return { x: p.y, y: -p.x };
}

function sortPoints(a: { x: number; y: number }[], b: { x: number; y: number }[]) {
  const s = (arr: { x: number; y: number }[]) =>
    [...arr]
      .map((p) => `${p.x},${p.y}`)
      .sort()
      .join('|');
  return s(a) === s(b);
}

describe('J/L rotation consistency (SRS origin)', () => {
  it('J rotation 1 and 3 match CW transforms from 0', () => {
    const base = TETROMINO_SHAPES['J'][0];
    const r1 = TETROMINO_SHAPES['J'][1];
    const r3 = TETROMINO_SHAPES['J'][3];
    const exp1 = base.map(rotateCW);
    const exp3 = rotateCW(rotateCW(rotateCW as any) as any);
    // Build expected r3 by applying CW three times to each point
    const exp3points = base.map((p) => rotateCW(rotateCW(rotateCW(p))));
    expect(sortPoints(r1 as any, exp1 as any)).toBe(true);
    expect(sortPoints(r3 as any, exp3points as any)).toBe(true);
  });

  it('L rotation 1 and 3 match CW transforms from 0', () => {
    const base = TETROMINO_SHAPES['L'][0];
    const r1 = TETROMINO_SHAPES['L'][1];
    const r3 = TETROMINO_SHAPES['L'][3];
    const exp1 = base.map(rotateCW);
    const exp3points = base.map((p) => rotateCW(rotateCW(rotateCW(p))));
    expect(sortPoints(r1 as any, exp1 as any)).toBe(true);
    expect(sortPoints(r3 as any, exp3points as any)).toBe(true);
  });
});

