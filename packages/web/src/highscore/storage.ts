import type { HighscoreEntry } from './types';

/**
 * Abstraction for reading and writing highscores per mode.
 *
 * Implementations should be resilient to malformed data and avoid throwing
 * on read paths. Write paths may log warnings on failure (e.g. quota).
 */
export interface HighscoreStorage {
  /** Read entries for a single mode. Never throws; returns [] on error/missing. */
  read(mode: string): HighscoreEntry[];
  /** Persist entries for a single mode (implementation may cap by limit). */
  write(mode: string, entries: HighscoreEntry[]): void;
  /** Read all modes under the storage namespace. */
  readAll(): Record<string, HighscoreEntry[]>;
  /** Write all modes provided; modes not present are left untouched unless cleared explicitly. */
  writeAll(data: Record<string, HighscoreEntry[]>): void;
  /** Clear one mode or all namespaced modes when `mode` is omitted. */
  clear(mode?: string): void;
  /** Current maximum entries per mode. */
  getLimit(): number;
  /** Update the maximum entries per mode (applies to subsequent writes). */
  setLimit(n: number): void;
}

/** Default localStorage prefix. */
export const DEFAULT_PREFIX = 'tetris.v1.highscores';

export { createLocalStorageStorage } from './storage.local';

