import { describe, it, expect } from 'vitest';
import { migrateEntry, migrateArray, CURRENT_VERSION } from './migrations';

describe('migrateEntry', () => {
  it('upgrades v0-like object to current with id and version', () => {
    const v0 = { score: 1000, lines: 12, level: 3, durationMs: 60000, mode: 'marathon' };
    const m = migrateEntry(v0)!;
    expect(m).toBeTruthy();
    expect(typeof m.id).toBe('string');
    expect(m.version).toBe(CURRENT_VERSION);
    expect(m.score).toBe(1000);
    expect(m.lines).toBe(12);
    expect(m.level).toBe(3);
    expect(m.durationMs).toBe(60000);
    expect(m.mode).toBe('marathon');
  });

  it('returns null for irrecoverable values', () => {
    // negative score and missing requireds
    expect(migrateEntry(null)).toBeNull();
    expect(migrateEntry({})).toBeNull();
    expect(migrateEntry({ score: -1, durationMs: 1, lines: 0, level: 0, mode: 'm' })).toBeNull();
  });
});

describe('migrateArray', () => {
  it('migrates entries and sorts by comparator', () => {
    const arr = [
      { score: 100, durationMs: 1000, lines: 10, level: 1, mode: 'marathon' },
      { score: 300, durationMs: 3000, lines: 15, level: 2, mode: 'marathon' },
      { score: 200, durationMs: 500, lines: 5, level: 1, mode: 'marathon' },
    ];
    const out = migrateArray(arr);
    expect(out.length).toBe(3);
    // Expect scores in 300, 200, 100 order after migrate+sort
    expect(out.map((e) => e.score)).toEqual([300, 200, 100]);
    // All have version and ids
    for (const e of out) {
      expect(typeof e.id).toBe('string');
      expect(e.version).toBe(CURRENT_VERSION);
    }
  });

  it('drops invalid records', () => {
    const arr = [
      { score: 100, durationMs: 1000, lines: 10, level: 1, mode: 'marathon' },
      { score: -5, durationMs: 100, lines: 0, level: 0, mode: 'marathon' },
    ];
    const out = migrateArray(arr);
    expect(out.length).toBe(1);
    expect(out[0]?.score).toBe(100);
  });
});

