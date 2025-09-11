/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalStorageStorage } from './storage.local';
import { HIGHSCORE_VERSION, type HighscoreEntry } from './types';

function entry(id: string, score = 0): HighscoreEntry {
  return {
    id,
    score,
    lines: 0,
    level: 0,
    durationMs: 0,
    timestamp: 0,
    mode: 'marathon',
    version: HIGHSCORE_VERSION,
  };
}

describe('localStorage highscore storage', () => {
  beforeEach(() => {
    // Reset storage between tests
    window.localStorage.clear();
  });

  it('returns [] when mode key is missing', () => {
    const s = createLocalStorageStorage({ prefix: 't.v1' });
    expect(s.read('marathon')).toEqual([]);
  });

  it('round-trips write/read preserving order', () => {
    const s = createLocalStorageStorage({ prefix: 't.v1' });
    const arr = [entry('a', 100), entry('b', 200), entry('c', 300)];
    s.write('marathon', arr);
    const got = s.read('marathon');
    expect(got.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('caps arrays according to limit on write', () => {
    const s = createLocalStorageStorage({ prefix: 't.v1', limit: 2 });
    const arr = [entry('a'), entry('b'), entry('c')];
    s.write('marathon', arr);
    const got = s.read('marathon');
    expect(got.length).toBe(2);
    expect(got.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('readAll returns all prefixed modes', () => {
    const s = createLocalStorageStorage({ prefix: 't.v1' });
    s.write('marathon', [entry('a')]);
    s.write('sprint', [entry('x')]);
    const all = s.readAll();
    expect(Object.keys(all).sort()).toEqual(['marathon', 'sprint']);
    expect(all.marathon?.[0]?.id).toBe('a');
    expect(all.sprint?.[0]?.id).toBe('x');
  });

  it('clear(mode) clears only the given mode', () => {
    const s = createLocalStorageStorage({ prefix: 't.v1' });
    s.write('marathon', [entry('a')]);
    s.write('sprint', [entry('x')]);
    s.clear('marathon');
    expect(s.read('marathon')).toEqual([]);
    expect(s.read('sprint').length).toBe(1);
  });

  it('clear() clears all with the prefix', () => {
    const s = createLocalStorageStorage({ prefix: 't.v1' });
    s.write('marathon', [entry('a')]);
    s.write('sprint', [entry('x')]);
    s.clear();
    expect(s.read('marathon')).toEqual([]);
    expect(s.read('sprint')).toEqual([]);
  });

  it('read tolerates corrupt JSON and returns []', () => {
    const s = createLocalStorageStorage({ prefix: 't.v1' });
    window.localStorage.setItem('t.v1.marathon', '{oops');
    expect(s.read('marathon')).toEqual([]);
  });
});

