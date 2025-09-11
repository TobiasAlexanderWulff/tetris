# Highscore-Core-plan

Subplan for types, validation, and ranking logic. Sized for a constrained agent to implement in one pass with tests.

## Scope

- Define stable TS types for highscore entries and API DTOs.
- Implement ranking comparator and helpers.
- Implement validation/sanitization for new submissions.

## Deliverables

- `packages/web/src/highscore/types.ts`
- `packages/web/src/highscore/ranking.ts`
- Tests: `packages/web/src/highscore/ranking.test.ts`, `packages/web/src/highscore/validation.test.ts`

## Files & APIs

- `packages/web/src/highscore/types.ts`
  - Exported types with docstrings:
    - `HighscoreEntry` — full stored record.
    - `NewHighscoreEntry` — minimal required fields for submission.
    - `HighscoreMode` — string union (start with `'marathon'`; keep extensible).
    - `HighscoreVersion` — numeric literal 1.
    - `MaybeSubmitResult` — `{ added: boolean; rank?: number }`.
    - `ImportManifest` — `{ version: number; generatedAt: number; modes: Record<string, HighscoreEntry[]> }`.
    - `Sanitized<T>` — helper generic alias.

- `packages/web/src/highscore/ranking.ts`
  - `compareEntries(a: HighscoreEntry, b: HighscoreEntry): number` — implements sort order.
  - `rankOf(entries: HighscoreEntry[], id: string): number | undefined` — 1-based rank after sort.
  - `cap(entries: HighscoreEntry[], limit: number): HighscoreEntry[]` — returns new array limited to `limit`.
  - `isValidNewEntry(x: unknown): x is NewHighscoreEntry` — shape/numeric guards.
  - `sanitizeNewEntry(x: NewHighscoreEntry): NewHighscoreEntry` — clamps numeric ranges, trims strings.

## Ranking Rules

1. Score desc.
2. Duration asc (faster is better).
3. Lines desc.
4. Timestamp asc (earlier wins ties).

## Step-by-Step

1. Create `types.ts` with the above types and JSDoc docstrings.
2. Create `ranking.ts` and implement comparator and helpers with pure functions.
3. Export everything from `packages/web/src/highscore/index.ts` (temporary re-export) or document to do in API step.
4. Add tests covering tie scenarios and rank computations.

## Tests to Write

- `ranking.test.ts`
  - Sort correctness for mixed entries.
  - Tie on score → duration breaks.
  - Tie on score+duration → lines breaks.
  - Full tie → timestamp asc.
- `validation.test.ts`
  - `isValidNewEntry` accepts minimal valid objects.
  - Rejects missing/NaN/negative invalid fields.
  - `sanitizeNewEntry` clamps negatives to 0; trims `mode`.

## Acceptance Criteria

- Types compile; tests green; comparator stable and deterministic.
- No side effects; pure functions only.

## Out of Scope

- Persistence, migrations, and UI.

