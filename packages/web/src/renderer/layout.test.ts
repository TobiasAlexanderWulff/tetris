import { describe, it, expect } from 'vitest';
import { computeBoardLayout } from './layout';

describe('layout', () => {
  it('centers board and computes integer cell size', () => {
    const l = computeBoardLayout(300, 600, 10, 20, 0);
    expect(l.cell).toBe(30); // min(300/10,600/20)=min(30,30)=30
    expect(l.bw).toBe(300);
    expect(l.bh).toBe(600);
    expect(l.ox).toBe(0);
    expect(l.oy).toBe(0);
  });

  it('applies padding and centers', () => {
    const l = computeBoardLayout(320, 240, 10, 20, 10);
    expect(l.cell).toBe(11); // inner 300x220 -> min(30,11) -> 11
    expect(l.ox).toBeGreaterThanOrEqual(0);
    expect(l.oy).toBeGreaterThanOrEqual(0);
  });
});

