import { describe, it, expect } from 'vitest';
import { compareEntries, rankOf, cap } from './ranking';
import { HIGHSCORE_VERSION, type HighscoreEntry } from './types';

function e(partial: Partial<HighscoreEntry> & Pick<HighscoreEntry, 'id'>): HighscoreEntry {
  // helper to construct entries with defaults
  return {
    id: partial.id,
    score: partial.score ?? 0,
    lines: partial.lines ?? 0,
    level: partial.level ?? 0,
    durationMs: partial.durationMs ?? 0,
    timestamp: partial.timestamp ?? 0,
    mode: partial.mode ?? 'marathon',
    version: HIGHSCORE_VERSION,
    seed: partial.seed,
    meta: partial.meta,
  };
}

describe('compareEntries', () => {
  it('sorts by score desc', () => {
    const arr = [e({ id: 'a', score: 100 }), e({ id: 'b', score: 300 }), e({ id: 'c', score: 200 })];
    const sorted = arr.slice().sort(compareEntries);
    expect(sorted.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('breaks ties by shorter duration', () => {
    const arr = [
      e({ id: 'a', score: 100, durationMs: 10 }),
      e({ id: 'b', score: 100, durationMs: 5 }),
    ];
    const sorted = arr.slice().sort(compareEntries);
    expect(sorted.map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('next tie-break by more lines', () => {
    const arr = [
      e({ id: 'a', score: 200, durationMs: 10, lines: 20 }),
      e({ id: 'b', score: 200, durationMs: 10, lines: 25 }),
    ];
    const sorted = arr.slice().sort(compareEntries);
    expect(sorted.map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('final tie-break by earlier timestamp', () => {
    const arr = [
      e({ id: 'a', score: 200, durationMs: 10, lines: 20, timestamp: 2000 }),
      e({ id: 'b', score: 200, durationMs: 10, lines: 20, timestamp: 1000 }),
    ];
    const sorted = arr.slice().sort(compareEntries);
    expect(sorted.map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('rankOf', () => {
  it('returns 1-based rank', () => {
    const arr = [
      e({ id: 'a', score: 100 }),
      e({ id: 'b', score: 300 }),
      e({ id: 'c', score: 200 }),
    ];
    expect(rankOf(arr, 'b')).toBe(1);
    expect(rankOf(arr, 'c')).toBe(2);
    expect(rankOf(arr, 'a')).toBe(3);
    expect(rankOf(arr, 'x')).toBeUndefined();
  });
});

describe('cap', () => {
  it('caps to the provided limit', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(cap(arr, 3)).toEqual([1, 2, 3]);
    expect(cap(arr, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(cap(arr, 0)).toEqual([]);
  });
});

