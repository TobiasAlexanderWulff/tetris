import { cap } from './ranking';
import type { HighscoreEntry } from './types';
import { DEFAULT_PREFIX } from './storage';

/**
 * Create a localStorage-backed HighscoreStorage implementation.
 *
 * Data is stored under `${prefix}.${mode}` keys as JSON arrays.
 * All read operations are fail-safe and return empty arrays on errors.
 */
export function createLocalStorageStorage(opts?: {
  prefix?: string;
  limit?: number;
}): {
  read: (mode: string) => HighscoreEntry[];
  write: (mode: string, entries: HighscoreEntry[]) => void;
  readAll: () => Record<string, HighscoreEntry[]>;
  writeAll: (data: Record<string, HighscoreEntry[]>) => void;
  clear: (mode?: string) => void;
  getLimit: () => number;
  setLimit: (n: number) => void;
} {
  let prefix = (opts?.prefix || DEFAULT_PREFIX).trim();
  if (!prefix) prefix = DEFAULT_PREFIX;
  let limit = Number.isFinite(opts?.limit) && (opts!.limit as number) > 0 ? (opts!.limit as number) : 50;

  const keyFor = (mode: string) => `${prefix}.${(mode || '').trim()}`;

  const safeParse = (raw: string | null): HighscoreEntry[] => {
    if (!raw) return [];
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? (v as HighscoreEntry[]) : [];
    } catch {
      return [];
    }
  };

  const read = (mode: string): HighscoreEntry[] => {
    try {
      return safeParse(window.localStorage.getItem(keyFor(mode)));
    } catch {
      return [];
    }
  };

  const write = (mode: string, entries: HighscoreEntry[]): void => {
    const arr = Array.isArray(entries) ? entries : [];
    const toSave = cap(arr, limit);
    try {
      window.localStorage.setItem(keyFor(mode), JSON.stringify(toSave));
    } catch (err) {
      // Quota exceeded or storage disabled
      console.warn('[highscore] Failed to write localStorage:', err);
    }
  };

  const readAll = (): Record<string, HighscoreEntry[]> => {
    const res: Record<string, HighscoreEntry[]> = {};
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k || !k.startsWith(prefix + '.')) continue;
        const mode = k.slice(prefix.length + 1);
        res[mode] = safeParse(window.localStorage.getItem(k));
      }
    } catch {
      // ignore and return what we have
    }
    return res;
  };

  const writeAll = (data: Record<string, HighscoreEntry[]>): void => {
    for (const [mode, entries] of Object.entries(data || {})) {
      write(mode, entries);
    }
  };

  const clear = (mode?: string): void => {
    try {
      if (mode) {
        window.localStorage.removeItem(keyFor(mode));
      } else {
        const keys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(prefix + '.')) keys.push(k);
        }
        for (const k of keys) window.localStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
  };

  const getLimit = () => limit;
  const setLimit = (n: number) => {
    if (Number.isFinite(n) && n > 0) limit = Math.floor(n);
  };

  return { read, write, readAll, writeAll, clear, getLimit, setLimit };
}

