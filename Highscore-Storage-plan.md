# Highscore-Storage-plan

Subplan for storage interface and localStorage-backed implementation with error handling and namespacing.

## Scope

- Storage interface abstraction.
- LocalStorage implementation.
- Key strategy, limits, and safe JSON parsing.

## Deliverables

- `packages/web/src/highscore/storage.ts` — interface + factory + helpers.
- `packages/web/src/highscore/storage.local.ts` — localStorage backend.
- Tests: `packages/web/src/highscore/storage.local.test.ts`.

## Files & APIs

- `storage.ts`
  - `export interface HighscoreStorage` with methods:
    - `read(mode: string): HighscoreEntry[]`
    - `write(mode: string, entries: HighscoreEntry[]): void`
    - `readAll(): Record<string, HighscoreEntry[]>`
    - `writeAll(data: Record<string, HighscoreEntry[]>): void`
    - `clear(mode?: string): void`
    - `getLimit(): number`
    - `setLimit(n: number): void`
  - `createLocalStorageStorage(opts?: { prefix?: string; limit?: number; version?: number }): HighscoreStorage`
  - `DEFAULT_PREFIX = 'tetris.v1.highscores'`

- `storage.local.ts`
  - Implementation details:
    - Key per mode: `${prefix}.${mode}`
    - Safe JSON parse/stringify with try/catch.
    - Cap arrays on `write` using `cap()` from ranking.
    - Ignore write errors (quota) but log `console.warn`.

## Step-by-Step

1. Define `HighscoreStorage` in `storage.ts` with docstrings linking to types.
2. Implement `createLocalStorageStorage` in `storage.local.ts` using `window.localStorage`.
3. Re-export factory from `storage.ts` for ease of import.
4. Use the `cap` helper from core to enforce limits.
5. Add graceful fallbacks: if parse fails, return `[]` and overwrite on next `write`.

## Tests to Write

- `storage.local.test.ts`
  - Read-empty mode returns `[]`.
  - Write then read round-trips and preserves order.
  - Over-limit arrays are capped to limit.
  - Corrupt JSON → read returns `[]` and does not throw.
  - `clear(mode)` clears only that mode; `clear()` clears all with prefix.

## Acceptance Criteria

- All methods work in JSDOM; no unhandled exceptions.
- Limit respected on write; keys are namespaced.

## Out of Scope

- Migrations (handled separately) and API-level validation.

