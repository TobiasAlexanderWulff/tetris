import {
  type HighscoreEntry,
  type NewHighscoreEntry,
  type Sanitized,
} from './types';

/**
 * Comparator implementing the highscore ordering rules.
 *
 * Priority:
 * 1) score: higher is better
 * 2) durationMs: lower is better (faster run)
 * 3) lines: higher is better (additional tie-break)
 * 4) timestamp: lower is better (earlier achiever)
 */
export function compareEntries(a: HighscoreEntry, b: HighscoreEntry): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.durationMs !== b.durationMs) return a.durationMs - b.durationMs;
  if (a.lines !== b.lines) return b.lines - a.lines;
  if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
  // Final tie-breaker: id lexicographic to keep sort stable across environments
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/** Return a shallow-copied array limited to `limit` items. */
export function cap<T>(arr: readonly T[], limit: number): T[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  if (arr.length <= limit) return arr.slice();
  return arr.slice(0, limit);
}

/** Compute the 1-based rank of an `id` within a pre-sorted or unsorted list. */
export function rankOf(entries: readonly HighscoreEntry[], id: string): number | undefined {
  const sorted = entries.slice().sort(compareEntries);
  const idx = sorted.findIndex((e) => e.id === id);
  return idx >= 0 ? idx + 1 : undefined;
}

/**
 * Shape guard ensuring a value resembles a valid NewHighscoreEntry.
 * Does not mutate; use sanitizeNewEntry for clamping.
 */
export function isValidNewEntry(x: unknown): x is NewHighscoreEntry {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(o, k);
  if (!has('score') || !has('lines') || !has('level') || !has('durationMs') || !has('mode')) return false;
  const score = o.score;
  const lines = o.lines;
  const level = o.level;
  const durationMs = o.durationMs;
  const mode = o.mode;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0) return false;
  if (typeof lines !== 'number' || !Number.isFinite(lines) || lines < 0) return false;
  if (typeof level !== 'number' || !Number.isFinite(level) || level < 0) return false;
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0) return false;
  if (typeof mode !== 'string' || mode.trim().length === 0) return false;
  return true;
}

/**
 * Returns a sanitized copy of a NewHighscoreEntry with numeric fields clamped
 * to non-negative integers (where applicable) and `mode` trimmed.
 */
export function sanitizeNewEntry(x: NewHighscoreEntry): Sanitized<NewHighscoreEntry> {
  const clamp0 = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const toInt = (n: number) => Math.max(0, Math.floor(n || 0));
  const mode = (x.mode || '').trim() || 'marathon';
  return {
    score: toInt(clamp0(x.score)),
    lines: toInt(clamp0(x.lines)),
    level: toInt(clamp0(x.level)),
    durationMs: clamp0(x.durationMs),
    mode,
    seed: typeof x.seed === 'string' ? x.seed.slice(0, 200) : undefined,
    meta: x.meta && typeof x.meta === 'object' ? { ...x.meta } : undefined,
  } as Sanitized<NewHighscoreEntry>;
}

