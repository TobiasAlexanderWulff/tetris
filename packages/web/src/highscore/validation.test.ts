import { describe, it, expect } from 'vitest';
import { isValidNewEntry, sanitizeNewEntry } from './ranking';

describe('isValidNewEntry', () => {
  it('accepts minimal valid object', () => {
    const ok = {
      score: 1234,
      lines: 10,
      level: 2,
      durationMs: 45678,
      mode: 'marathon',
    };
    expect(isValidNewEntry(ok)).toBe(true);
  });

  it('rejects negative or NaN numbers and empty mode', () => {
    const bads: unknown[] = [
      {},
      { score: -1, lines: 0, level: 0, durationMs: 0, mode: 'm' },
      { score: 0, lines: -1, level: 0, durationMs: 0, mode: 'm' },
      { score: 0, lines: 0, level: -1, durationMs: 0, mode: 'm' },
      { score: 0, lines: 0, level: 0, durationMs: -1, mode: 'm' },
      { score: Number.NaN, lines: 0, level: 0, durationMs: 0, mode: 'm' },
      { score: 0, lines: 0, level: 0, durationMs: 0, mode: '' },
      { score: 0, lines: 0, level: 0, durationMs: 0, mode: '   ' },
    ];
    for (const b of bads) expect(isValidNewEntry(b)).toBe(false);
  });
});

describe('sanitizeNewEntry', () => {
  it('clamps and normalizes fields', () => {
    const raw = {
      score: 1234.8,
      lines: 10.9,
      level: 2.1,
      durationMs: -5, // clamped to 0
      mode: '  marathon  ',
      seed: 'seed-xyz',
      meta: { input: 'kb' },
    };
    const s = sanitizeNewEntry(raw);
    expect(s.score).toBe(1234);
    expect(s.lines).toBe(10);
    expect(s.level).toBe(2);
    expect(s.durationMs).toBe(0);
    expect(s.mode).toBe('marathon');
    expect(s.seed).toBe('seed-xyz');
    expect(s.meta).toEqual({ input: 'kb' });
  });

  it('defaults empty mode to marathon', () => {
    const s = sanitizeNewEntry({ score: 1, lines: 1, level: 0, durationMs: 1, mode: '   ' });
    expect(s.mode).toBe('marathon');
  });
});
