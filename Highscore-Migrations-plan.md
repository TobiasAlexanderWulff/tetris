# Highscore-Migrations-plan

Subplan for schema versioning and upgrade path.

## Scope

- Migrate arrays of entries to current version.
- Preserve unknown fields in `meta`.

## Deliverables

- `packages/web/src/highscore/migrations.ts`
- Tests: `packages/web/src/highscore/migrations.test.ts`

## Files & APIs

- `migrations.ts`
  - `CURRENT_VERSION = 1`
  - `export function migrateEntry(e: any): HighscoreEntry | null` — validate/upgrade or return `null` if irrecoverable.
  - `export function migrateArray(arr: any[]): HighscoreEntry[]` — map + filter + sort by comparator.
  - Internals: version switch; v0→v1 fills missing `id`, `timestamp`, `version` fields.

## Step-by-Step

1. Define `CURRENT_VERSION` and the migration functions.
2. For v0 (legacy without version/id), generate ids and set version=1; coerce types; drop invalid records.
3. Ensure `migrateArray` sorts via `compareEntries` to normalize ordering on read.
4. Export from `index.ts` to be used by storage/API on read/import paths.

## Tests to Write

- `migrations.test.ts`
  - Upgrade v0 array: preserves scores, fills ids, sets version=1.
  - Drops nonsensical records (negative scores, NaN fields).
  - Sorted result matches comparator.

## Acceptance Criteria

- Migration produces valid arrays; stable sort order; no unhandled exceptions.

## Out of Scope

- Backend persistence — local only.

