import {
  HIGHSCORE_VERSION,
  type HighscoreEntry,
  type HighscoreMode,
  type ImportManifest,
  type MaybeSubmitResult,
  type NewHighscoreEntry,
} from './types';
import { compareEntries, isValidNewEntry, sanitizeNewEntry, cap } from './ranking';
import { CURRENT_VERSION, migrateArray } from './migrations';
import { createLocalStorageStorage } from './storage.local';
import type { HighscoreStorage } from './storage';

let storage: HighscoreStorage | null = null;

/**
 * Initialize the highscore subsystem.
 *
 * Safe to call multiple times; the last call updates the internal storage
 * configuration (limit/prefix). If not called explicitly, a default
 * localStorage-backed storage is created on first use.
 */
export function initHighscores(opts?: {
  limit?: number;
  prefix?: string;
  knownModes?: HighscoreMode[];
}): void {
  storage = createLocalStorageStorage({ limit: opts?.limit, prefix: opts?.prefix });
}

function ensureInit(): HighscoreStorage {
  if (!storage) initHighscores();
  return storage!;
}

/**
 * Read highscores for a mode, migrated and sorted according to rules.
 */
export function getHighscores(mode: string): HighscoreEntry[] {
  const s = ensureInit();
  const raw = s.read(mode);
  const migrated = migrateArray(raw);
  // Sorting after migration guarantees deterministic order
  return migrated.sort(compareEntries);
}

/**
 * Submit a highscore candidate. If it deserves a place within the per-mode
 * limit, it is inserted and the rank is returned.
 */
export function maybeSubmit(entry: NewHighscoreEntry): MaybeSubmitResult {
  const s = ensureInit();
  if (!isValidNewEntry(entry)) return { added: false };
  const clean = sanitizeNewEntry(entry);
  const id = getRandomUUID();
  const full: HighscoreEntry = {
    ...clean,
    id,
    timestamp: Date.now(),
    version: HIGHSCORE_VERSION,
  };
  const existing = getHighscores(clean.mode);
  const combined = existing.concat(full).sort(compareEntries);
  const limit = s.getLimit();
  const capped = cap(combined, limit);
  s.write(clean.mode, capped);
  const rank = combined.findIndex((e) => e.id === id) + 1;
  const added = rank > 0 && rank <= limit;
  return added ? { added, rank } : { added: false };
}

/** Clear highscores for a mode or all modes (when omitted). */
export function clearHighscores(mode?: string): void {
  const s = ensureInit();
  s.clear(mode);
}

/**
 * Export all highscores as a JSON string manifest.
 */
export function exportHighscores(): string {
  const s = ensureInit();
  const all = s.readAll();
  const normalized: Record<string, HighscoreEntry[]> = {};
  for (const [mode, arr] of Object.entries(all)) {
    normalized[mode] = migrateArray(arr).sort(compareEntries);
  }
  const manifest: ImportManifest = {
    version: CURRENT_VERSION,
    generatedAt: Date.now(),
    modes: normalized,
  };
  return JSON.stringify(manifest);
}

/**
 * Import highscores from a JSON manifest string.
 *
 * - strategy 'merge' (default): combine with existing, de-duplicate by id,
 *   sort and cap per-mode.
 * - strategy 'replace': overwrite each provided mode.
 */
export function importHighscores(
  json: string,
  strategy: 'merge' | 'replace' = 'merge',
): { ok: boolean; errors: string[]; imported: number } {
  const s = ensureInit();
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, errors: ['Invalid JSON'], imported: 0 };
  }
  if (!isManifestShape(parsed)) {
    return { ok: false, errors: ['Invalid manifest shape'], imported: 0 };
  }
  // Accept other versions by migrating entries; version field is informational here.
  let imported = 0;
  for (const [mode, arr] of Object.entries(parsed.modes)) {
    const migrated = migrateArray(Array.isArray(arr) ? arr : []);
    imported += migrated.length;
    if (strategy === 'replace') {
      s.write(mode, cap(migrated.sort(compareEntries), s.getLimit()));
    } else {
      // merge: by id de-dup
      const existing = getHighscores(mode);
      const map = new Map<string, HighscoreEntry>();
      for (const e of existing) map.set(e.id, e);
      for (const e of migrated) map.set(e.id, e);
      const merged = Array.from(map.values()).sort(compareEntries);
      s.write(mode, cap(merged, s.getLimit()));
    }
  }
  return { ok: true, errors, imported };
}

function fallbackId(): string {
  const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `hs-${Date.now().toString(16)}-${rnd()}-${rnd()}`;
}

function getRandomUUID(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return fallbackId();
}

function isManifestShape(x: unknown): x is { modes: Record<string, unknown> } {
  if (!x || typeof x !== 'object') return false;
  const maybeModes = (x as Record<string, unknown>)['modes'];
  return !!maybeModes && typeof maybeModes === 'object';
}

// Re-exports to ease single-point imports for consumers
export * from './types';
export * from './ranking';
export * from './migrations';
