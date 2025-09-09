import { describe, it, expect } from 'vitest';
import { getPalette } from './colors';

describe('color palettes', () => {
  it('color-blind palette has distinct cell colors', () => {
    const p = getPalette('color-blind');
    const set = new Set<string>();
    for (let i = 1; i <= 7; i++) {
      set.add(p.cells[i]!);
    }
    expect(set.size).toBe(7);
  });
});

