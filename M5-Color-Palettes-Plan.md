# M5 — Color‑Blind Palettes — Plan

Goal: Provide accessible, color‑blind‑friendly tetromino palettes and integrate them with existing theming in renderer and UI.

## Current State

- `packages/web/src/renderer/colors.ts` defines `Palette` and `getPalette(theme)` (dark/default/high‑contrast in use).
- UI respects theme via `useSettings().theme` and passes `palette` to components and `CanvasRenderer`.

## Tasks

- Add one or more color‑blind‑friendly palettes (e.g., Deuteranopia/Protanopia‑safe). Include ghost, grid, bg colors.
- Extend `theme` settings union to include `color-blind` (e.g., `cb-friendly`). Migrate persisted settings with fallback.
- Provide palette documentation and mapping rationale (distinct hue + luminance separation, simulator references).
- Update `SettingsModal` Video/Theme panel to show preview swatches and descriptions.
- Ensure HUD text and key UI colors meet ≥ 4.5:1 contrast with background in each theme.

## Tests

- Unit: colors
  - `colorForCellWithPalette` yields distinct values for 7 ids in the color‑blind palette.
  - Contrast utility: verify computed contrast ratios for HUD tokens ≥ 4.5 (if a util exists; otherwise document manual check).
- E2E: Playwright
  - Toggle to color‑blind theme; verify canvas/hud colors update; persist across reload.

## Acceptance

- At least one color‑blind‑friendly palette shipped and selectable; renderer and previews use it consistently.
- Contrast targets met; theme persisted; switch is instant without restart.

