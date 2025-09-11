import { compareEntries, sanitizeNewEntry } from './ranking';
import {
  HIGHSCORE_VERSION,
  type HighscoreEntry,
  type NewHighscoreEntry,
} from './types';

/** Current entry schema version. */
export const CURRENT_VERSION = HIGHSCORE_VERSION;

/**
 * Try to migrate an unknown value into a valid HighscoreEntry.
 * Returns null if irrecoverable.
 */
export function migrateEntry(e: unknown): HighscoreEntry | null {
  if (!e || typeof e !== 'object') return null;
  const o = e as Record<string, unknown>;

  // If it already looks like a current entry, lightly sanitize and return.
  if (typeof o['id'] === 'string' && typeof o['timestamp'] !== 'undefined') {
    const ne: NewHighscoreEntry = {
      score: toNumber(o['score']),
      lines: toNumber(o['lines']),
      level: toNumber(o['level']),
      durationMs: toNumber(o['durationMs']),
      mode: typeof o['mode'] === 'string' ? (o['mode'] as string) : 'marathon',
      seed: typeof o['seed'] === 'string' ? (o['seed'] as string) : undefined,
      meta: o['meta'] && typeof o['meta'] === 'object' ? { ...(o['meta'] as object) } : undefined,
    };
    if (!isReasonableNew(ne)) return null;
    const s = sanitizeNewEntry(ne);
    const ts = isFiniteNumber(o['timestamp']) ? (o['timestamp'] as number) : 0;
    return { ...s, id: o['id'] as string, timestamp: ts, version: CURRENT_VERSION };
  }

  // v0-style or arbitrary input: attempt to coerce into a NewHighscoreEntry, then fill id/timestamp.
  const ne0: NewHighscoreEntry = {
    score: toNumber(o['score']),
    lines: toNumber(o['lines']),
    level: toNumber(o['level']),
    durationMs: toNumber(o['durationMs']),
    mode: typeof o['mode'] === 'string' ? (o['mode'] as string) : 'marathon',
    seed: typeof o['seed'] === 'string' ? (o['seed'] as string) : undefined,
    meta: o['meta'] && typeof o['meta'] === 'object' ? { ...(o['meta'] as object) } : undefined,
  };
  if (!isReasonableNew(ne0)) return null;
  const s0 = sanitizeNewEntry(ne0);
  return {
    ...s0,
    id: fallbackId(),
    timestamp: 0,
    version: CURRENT_VERSION,
  };
}

/** Migrate an array and return a sorted array of valid entries. */
export function migrateArray(arr: unknown[]): HighscoreEntry[] {
  if (!Array.isArray(arr)) return [];
  const out: HighscoreEntry[] = [];
  for (const x of arr) {
    const m = migrateEntry(x);
    if (m) out.push(m);
  }
  return out.sort(compareEntries);
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function toNumber(n: unknown): number {
  if (typeof n === 'number') return n;
  if (typeof n === 'string') {
    const p = Number(n);
    return Number.isFinite(p) ? p : NaN;
  }
  return NaN;
}

function isReasonableNew(ne: NewHighscoreEntry): boolean {
  return (
    isFiniteNumber(ne.score) && ne.score >= 0 &&
    isFiniteNumber(ne.lines) && ne.lines >= 0 &&
    isFiniteNumber(ne.level) && ne.level >= 0 &&
    isFiniteNumber(ne.durationMs) && ne.durationMs >= 0 &&
    typeof ne.mode === 'string' && ne.mode.trim().length > 0
  );
}

function fallbackId(): string {
  // Lightweight UUID-ish fallback (not crypto-strong; sufficient for local ids)
  const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `migrated-${Date.now().toString(16)}-${rnd()}-${rnd()}`;
}
