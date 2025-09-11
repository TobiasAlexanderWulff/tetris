# Highscore-Plan

Plan to design and implement a modular, testable high score system for this Tetris project. Scope focuses on local highscores with clean extension points for future cloud sync.

## Goals

- Persist top results locally across sessions per game mode.
- Provide stable ranking and tie-break rules.
- Surface highscores in HUD and Game Over UI.
- Simple import/export for backup and sharing.
- Modular architecture with thorough tests and docstrings.

## Non-Goals (for now)

- Online leaderboards or auth.
- Anti-cheat or tamper-proofing beyond basic validation.

## Data Model

- Entry: `{ id, score, lines, level, durationMs, timestamp, seed, mode, version, meta }`
  - `id`: string (uuid v4) for stable references.
  - `score`: number (total score at game over).
  - `lines`: number (total lines cleared).
  - `level`: number (final level reached).
  - `durationMs`: number (session duration).
  - `timestamp`: number (ms since epoch)
  - `seed`: string | undefined (PRNG seed used for reproducibility).
  - `mode`: string (e.g., `marathon`, `sprint-40l`, `ultra-2m`).
  - `version`: number (schema version for migrations).
  - `meta`: object (optional; input method, fps cap, etc.).

## Ranking Rules

1. Sort by `score` desc.
2. Tie: lower `durationMs` wins (faster run).
3. Tie: higher `lines` wins.
4. Tie: earlier `timestamp` wins (first achiever).

These rules apply per `mode`.

## Storage Strategy

- Default: `localStorage` with namespaced keys (small data, simple tests).
- Key format: `tetris.v1.highscores.<mode>` → JSON array of entries.
- Max entries per mode: 50 (configurable).
- Migration support: bump `version` when schema changes; run per-mode migration on read.
- Optional later: `IndexedDB` backend if growth warrants it; keep the storage behind an interface.

## Public API (Web Package)

- `initHighscores(opts?): void` — set limits, register migrations.
- `getHighscores(mode: string): HighscoreEntry[]` — sorted, sanitized.
- `maybeSubmit(entry: NewHighscoreEntry): { added: boolean; rank?: number }` — inserts if it deserves a place; returns rank.
- `clearHighscores(mode?: string): void` — clear mode or all.
- `exportHighscores(): string` — returns JSON string of all modes.
- `importHighscores(json: string, strategy?: 'merge'|'replace'): ImportReport` — validates and merges/replaces.

## Package Layout

- `packages/web/src/highscore/types.ts` — types, docstrings.
- `packages/web/src/highscore/ranking.ts` — comparator, tie-break logic.
- `packages/web/src/highscore/storage.ts` — storage interface + localStorage impl.
- `packages/web/src/highscore/index.ts` — public API, validation, migrations.
- `packages/web/src/highscore/migrations.ts` — schema migrations.
- `packages/web/src/state/highscore.ts` — optional React hook/state helpers.
- `packages/web/src/ui/HighscoreTable.tsx` — reusable table component.
- Tests mirroring the above files (`*.test.ts[x]`).

## Integration Points

- `packages/web/src/game/GameHost.ts` — on game over, construct `NewHighscoreEntry` from engine state and call `maybeSubmit`.
- `packages/web/src/ui/HUD.tsx` — show current top score for active mode and player’s PB.
- `packages/web/src/ui/GameOverOverlay.tsx` — display “New High Score!” banner and rank; show table.
- `packages/web/src/ui/SettingsModal.tsx` — add “Manage Highscores”: clear, export, import.

## Validation & Sanitization

- Clamp numeric fields to reasonable ranges; drop entries with missing required fields.
- Require `mode` to be a known string; unknown modes get their own bucket but flagged in `meta`.
- Guard against `localStorage` quota and JSON parse errors; fallback to empty array.

## Error Handling

- Fail-safe reads: never throw to UI; log to console and return empty arrays.
- API returns structured results (`added`, `rank`, `errors`).

## Testing Plan

- `ranking.test.ts`
  - Orders entries by rules; covers tie-breakers.
- `storage.test.ts`
  - Insert, cap by limit, stable sorting, id generation uniqueness.
  - Corrupted JSON → recovery to empty.
- `migrations.test.ts`
  - Upgrade from v0→v1; preserve fields and ordering.
- `index.test.ts`
  - `maybeSubmit` returns expected `added`/`rank`; respects caps; rejects invalid input.
- UI tests
  - `HighscoreTable.test.tsx`: renders list, empty state, formatting.
  - `GameOverOverlay.test.tsx`: shows “New High Score” when appropriate.

## Performance

- Arrays limited to 50 per mode; operations O(n log n) at worst — trivial cost.
- Batch `localStorage` writes and avoid re-render loops via memoized selectors.

## Accessibility & UX

- Table: keyboard navigable, ARIA roles, readable formatting.
- Clear controls to export/import/clear with confirmation prompts.

## Security & Privacy

- Local-only data; no network.
- Mark exported JSON as user data; include schema `version` and `generatedAt`.

## Migration Strategy

- `version` on each entry and in export manifest.
- On read: detect and migrate arrays; unknown fields preserved in `meta`.

## Rollout Steps

1. Implement `types`, `ranking`, `storage` with tests.
2. Add `index` API + migrations with tests.
3. Integrate into `GameHost` game-over flow.
4. Add `HighscoreTable` and wire into `GameOverOverlay` and `HUD`.
5. Add settings actions (export/import/clear) with tests.
6. Polish copy, a11y, and edge-case handling.

## Acceptance Criteria

- Submitting a completed game updates highscores per mode when eligible.
- UI displays top list and “New High Score” correctly.
- Import/export works and passes validation.
- All new tests pass; existing tests unaffected.

## Open Questions

- Which game modes are officially supported for v1? (`marathon` only?)
- Display format preferences (top 10 vs. 50; show seed?).

---

If needed, we can split this into smaller tasks:

- Highscore-Core-plan.md — API, ranking, storage, migrations.
- Highscore-UI-plan.md — UI views, HUD integration, settings tooling.

