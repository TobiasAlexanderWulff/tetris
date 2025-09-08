import { describe, it, expect } from 'vitest';
import { clearFullRows, createGrid, idx, type BoardSpec } from '../src/board/board';

describe('board line clear and compaction', () => {
  it('clears single full row and compacts above', () => {
    const spec: BoardSpec = { width: 4, heightVisible: 4, bufferRows: 0 };
    const g = createGrid(spec);
    // Fill bottom row (y=3)
    for (let x = 0; x < spec.width; x++) g[idx(spec, x, 3)] = 7;
    // Add a block at (1,2)
    g[idx(spec, 1, 2)] = 3;
    const cleared = clearFullRows(spec, g);
    expect(cleared).toEqual([3]);
    // After compaction, (1,3) should now contain previous (1,2)
    expect(g[idx(spec, 1, 3)]).toBe(3);
    // Top row cleared to 0
    for (let x = 0; x < spec.width; x++) expect(g[idx(spec, x, 0)]).toBe(0);
  });

  it('clears multiple rows', () => {
    const spec: BoardSpec = { width: 3, heightVisible: 5, bufferRows: 0 };
    const g = createGrid(spec);
    // Fill y=1 and y=3 fully
    for (let x = 0; x < spec.width; x++) {
      g[idx(spec, x, 1)] = 1;
      g[idx(spec, x, 3)] = 2;
    }
    // Put marker at y=2,x=0
    g[idx(spec, 0, 2)] = 5;
    const cleared = clearFullRows(spec, g);
    expect(cleared).toEqual([1, 3]);
    // Marker was at y=2 and only a row below (y=3) was cleared relative to it, so it drops by 1
    expect(g[idx(spec, 0, 3)]).toBe(5);
  });
});
