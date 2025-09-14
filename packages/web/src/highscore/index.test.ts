/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  initHighscores,
  getHighscores,
  maybeSubmit,
  clearHighscores,
  exportHighscores,
  importHighscores,
  type NewHighscoreEntry,
} from './index';

const base: NewHighscoreEntry = {
  score: 0,
  lines: 0,
  level: 0,
  durationMs: 1000,
  mode: 'marathon',
};

describe('highscore API', () => {
  beforeEach(() => {
    window.localStorage.clear();
    initHighscores({ prefix: 'hs.test', limit: 2 });
  });

  it('submits an entry and returns rank', () => {
    const r1 = maybeSubmit({ ...base, score: 100 });
    expect(r1.added).toBe(true);
    expect(r1.rank).toBe(1);
    const r2 = maybeSubmit({ ...base, score: 200 });
    expect(r2.added).toBe(true);
    expect(r2.rank).toBe(1);
    const list = getHighscores('marathon');
    expect(list.length).toBe(2);
    expect(list[0]!.score).toBe(200);
    expect(list[1]!.score).toBe(100);
  });

  it('respects per-mode limit and rejects when out of range', () => {
    maybeSubmit({ ...base, score: 300 });
    maybeSubmit({ ...base, score: 200 });
    const r3 = maybeSubmit({ ...base, score: 100 });
    expect(r3.added).toBe(false);
    const list = getHighscores('marathon');
    expect(list.map((x) => x.score)).toEqual([300, 200]);
  });

  it('exports and imports manifest (merge)', () => {
    maybeSubmit({ ...base, score: 400 });
    const json = exportHighscores();
    clearHighscores();
    expect(getHighscores('marathon')).toEqual([]);
    const res = importHighscores(json, 'merge');
    expect(res.ok).toBe(true);
    expect(getHighscores('marathon')[0]?.score).toBe(400);
  });

  it('import replace overwrites the mode', () => {
    maybeSubmit({ ...base, score: 100 });
    const json = exportHighscores();
    // add a better score, then replace with old export
    maybeSubmit({ ...base, score: 999 });
    const before = getHighscores('marathon');
    expect(before[0]!.score).toBe(999);
    const res = importHighscores(json, 'replace');
    expect(res.ok).toBe(true);
    const after = getHighscores('marathon');
    expect(after[0]!.score).toBe(100);
  });
});
