/**
 * Highscore types for local, per-mode leaderboards.
 *
 * These types intentionally avoid framework-specific concerns and can be
 * shared by storage, API, and UI layers.
 */

/** Current schema version stored with each entry. */
export const HIGHSCORE_VERSION = 1 as const;

/**
 * Known game modes may expand over time. Use a string to remain extensible
 * while documenting the default canonical mode used in v1.
 */
export type HighscoreMode = 'marathon' | (string & NonNullable<unknown>);

/**
 * Minimal data provided by the game when submitting a new highscore.
 * ID, timestamp, and version are assigned by the API layer.
 */
export interface NewHighscoreEntry {
  /** Total score at game over. */
  score: number;
  /** Total lines cleared during the run. */
  lines: number;
  /** Final level reached. */
  level: number;
  /** Duration of the run in milliseconds. */
  durationMs: number;
  /** Game mode bucket, e.g. 'marathon'. */
  mode: HighscoreMode;
  /** Optional seed for reproducibility/debugging. */
  seed?: string;
  /** Optional extra metadata such as input method, fps cap, etc. */
  meta?: Record<string, unknown>;
}

/**
 * Full stored highscore record.
 */
export interface HighscoreEntry extends NewHighscoreEntry {
  /** Stable unique identifier. */
  id: string;
  /** Milliseconds since epoch when the run ended. */
  timestamp: number;
  /** Schema version of this entry. */
  version: typeof HIGHSCORE_VERSION;
}

/** Result of a conditional submission attempt. */
export interface MaybeSubmitResult {
  /** True if the entry made it into the table for its mode. */
  added: boolean;
  /** 1-based rank of the new entry, if added. */
  rank?: number;
}

/**
 * Export manifest format for import/export operations.
 */
export interface ImportManifest {
  /** Schema version for the manifest. */
  version: typeof HIGHSCORE_VERSION;
  /** Generation timestamp (ms since epoch). */
  generatedAt: number;
  /** Mapping of mode -> array of entries. */
  modes: Record<string, HighscoreEntry[]>;
}

/** Helper alias for explicitly sanitized values. */
export type Sanitized<T> = T & { readonly __sanitized?: true };

/** A small constant list of canonical modes for v1 UI hints. */
export const KNOWN_MODES: readonly HighscoreMode[] = ['marathon'];
