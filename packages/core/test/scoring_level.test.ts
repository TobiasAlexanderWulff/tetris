import { describe, it, expect } from 'vitest';
import { createEngine } from '../src';

describe('scoring and levels (M3)', () => {
  it('adds hard drop bonuses to score on lock', () => {
    const e = createEngine({
      scoring: {
        single: 100,
        double: 300,
        triple: 500,
        tetris: 800,
        softPerCell: 1,
        hardPerCell: 2,
        b2bMultiplier: 1.5,
        comboBase: 50,
        levelLines: 10,
      },
      gravityTable: { 0: 0.5 },
    }, 1);
    const score0 = e.getSnapshot().score;
    // Force a hard drop and lock
    e.enqueueInput({ type: 'HardDrop', at: 0 });
    e.update(17);
    const score1 = e.getSnapshot().score;
    expect(score1).toBeGreaterThan(score0);
  });

  it('exposes level and lines in snapshot', () => {
    const e = createEngine({}, 2);
    const s = e.getSnapshot();
    expect(typeof s.level).toBe('number');
    expect(typeof s.linesClearedTotal).toBe('number');
    expect(typeof s.score).toBe('number');
  });
});

