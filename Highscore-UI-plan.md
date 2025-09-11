# Highscore-UI-plan

Subplan for highscore visualization and management UI.

## Scope

- Reusable `HighscoreTable` component.
- Settings controls for export/import/clear.
- HUD tweak to show PB for current mode (optional).

## Deliverables

- `packages/web/src/ui/HighscoreTable.tsx`
- Tests: `packages/web/src/ui/HighscoreTable.test.tsx`
- Changes in `packages/web/src/ui/GameOverOverlay.tsx` to show banner and table (minimal props extension).
- Changes in `packages/web/src/ui/SettingsModal.tsx` to add manage actions.

## Files & APIs

- `HighscoreTable.tsx`
  - Props: `{ entries: HighscoreEntry[]; max?: number }`.
  - Renders columns: Rank, Score, Lines, Level, Time, Date.
  - A11y: role="table", keyboard focusable rows.

- `GameOverOverlay.tsx`
  - Extend props: `newHigh?: boolean; rank?: number; top?: HighscoreEntry[]`.
  - Conditionally render banner: “New High Score! #{rank}”.
  - Optionally render top 10 table using `HighscoreTable`.

- `SettingsModal.tsx`
  - Add buttons: Export, Import, Clear Highscores (with confirm).
  - Wire to API: `exportHighscores()`, `importHighscores(json, strategy)`, `clearHighscores()`.

## Step-by-Step

1. Build `HighscoreTable.tsx` with inline styles matching existing UI style.
2. Add unit test rendering 3 entries and asserting column contents and order.
3. Update `GameOverOverlay.tsx` props and UI; keep styles minimal.
4. In `GameCanvas.tsx`, when game over, fetch top entries via `getHighscores('marathon')` and pass to overlay.
5. Update `SettingsModal.tsx` with a simple section to call APIs and show result toasts.

## Tests to Write

- `HighscoreTable.test.tsx`
  - Renders headers and rows; handles empty list gracefully.
  - Truncates to `max` if provided.
- Extend `GameOverOverlay.test.tsx`
  - Shows banner when `newHigh` true; hides otherwise.

## Acceptance Criteria

- Table renders consistently; settings actions call APIs without exceptions.

## Out of Scope

- Online leaderboards or avatars.

