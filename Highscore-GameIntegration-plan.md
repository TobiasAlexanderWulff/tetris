# Highscore-GameIntegration-plan

Subplan for wiring highscore submission into the existing game flow.

## Scope

- Submit highscore on game over with relevant stats.
- Show “New High Score” indicator and rank in Game Over overlay props/state.

## Deliverables

- Changes in `packages/web/src/ui/GameCanvas.tsx`.
- Optional helpers in `packages/web/src/state/highscore.tsx` (lightweight state/selectors).
- Tests: `packages/web/src/ui/GameOverOverlay.test.tsx` (extend) or new `GameCanvas.highscore.test.tsx`.

## Data to Submit

- `score` — from state.
- `lines` — from state.
- `level` — from state.
- `durationMs` — measure from mount/start to game over via `performance.now()`.
- `timestamp` — generated in API.
- `mode` — `'marathon'` (v1 default) or from a future mode selector.
- `seed` — from engine initialization if exposed (currently via `createDefaultEngine` param; for now, omit or store if present).

## Step-by-Step

1. In `GameCanvas.tsx`, add a `startTimeRef` captured when a new instance starts; on Game Over event, compute `durationMs`.
2. Import `{ initHighscores, maybeSubmit, getHighscores }` from `packages/web/src/highscore` and call `initHighscores()` once on mount.
3. On `GameOver` event handler, build `NewHighscoreEntry` and call `maybeSubmit`.
4. Store result in local component state: `{ newHigh: boolean, rank?: number }`.
5. Pass props to `GameOverOverlay` (extend props): `newHigh`, `rank`, and `top` array via `getHighscores('marathon')`.
6. Add a lightweight test that simulates a game until `GameOver`, then asserts `maybeSubmit` called and overlay shows banner when rank=1.

## Tests to Write

- Extend `GameOverOverlay.test.tsx` or add `GameCanvas.highscore.test.tsx`:
  - Mock API to return `{ added: true, rank: 1 }` and expect banner text visible.
  - Mock API to return `{ added: false }` and expect no banner.

## Acceptance Criteria

- Highscore submission triggers exactly once per game over.
- UI reflects new highscore with rank where applicable.

## Out of Scope

- Settings import/export and table UI (handled in UI plan).

