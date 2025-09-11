# Highscore-API-plan

Subplan for public highscore API: initialization, submission, querying, import/export, and clearing.

## Scope

- Public functions exposed by `packages/web/src/highscore/index.ts`.
- Validation and ID generation.
- Deterministic ranking + capping via storage.

## Deliverables

- `packages/web/src/highscore/index.ts` — API surface with docstrings.
- Tests: `packages/web/src/highscore/index.test.ts`.

## Files & APIs

- `index.ts`
  - `initHighscores(opts?: { limit?: number; prefix?: string; knownModes?: string[] }): void`
    - Creates a storage instance (localStorage) and stores module-level singleton.
  - `getHighscores(mode: string): HighscoreEntry[]`
    - Reads from storage; sorts using `compareEntries`; returns new array.
  - `maybeSubmit(entry: NewHighscoreEntry): { added: boolean; rank?: number }`
    - Validates + sanitizes input, assigns `id`, `timestamp`, `version`.
    - Merges with existing, sorts, caps, writes; computes 1-based rank.
  - `clearHighscores(mode?: string): void`
  - `exportHighscores(): string`
    - JSON manifest: `{ version: 1, generatedAt: now, modes: { [mode]: HighscoreEntry[] } }`
  - `importHighscores(json: string, strategy?: 'merge' | 'replace'): { ok: boolean; errors: string[]; imported: number }`
    - Validates manifest version; strategy rules; dedup by `id`.

## Step-by-Step

1. Implement a module-local `let storage: HighscoreStorage` and `ensureInit()` guard.
2. Implement `initHighscores` with defaults and simple idempotence (subsequent calls update limit/prefix if provided).
3. Implement `getHighscores` using `storage.read` + `compareEntries`.
4. Implement `maybeSubmit`:
   - Validate/sanitize via core helpers.
   - Create `id` via `crypto.randomUUID?.() ?? fallbackRandomId()`.
   - Build full `HighscoreEntry` with defaulted fields.
   - Read existing, push, sort, cap, write, compute rank.
5. Implement `clearHighscores`, `exportHighscores`, and `importHighscores` with error capture.

## Tests to Write

- `index.test.ts`
  - `getHighscores` returns sorted values.
  - `maybeSubmit` adds when eligible and returns rank; respects cap.
  - Reject invalid `NewHighscoreEntry`.
  - `exportHighscores` → parseable manifest with correct counts.
  - `importHighscores` merge vs. replace; dedup by `id`.

## Acceptance Criteria

- API stable; deterministic ranks; no throws on malformed input/export.

## Out of Scope

- UI and game integration wiring.

