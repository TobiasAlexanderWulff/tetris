# UI — Plan

Purpose: Define the user interface architecture, components, and flows for the Tetris web app. Focus on a clean, responsive UI over a high‑performance Canvas game surface, aligned with plan.md and current modules (GameHost, CanvasRenderer, KeyboardInput).

## Goals

- Simple, legible, responsive UI that frames the canvas without stealing focus.
- Keyboard‑first play; mouse/touch friendly for menus and optional mobile controls.
- Clear HUD: score, level, lines, next queue, hold, and pause/game over overlays.
- Settings for key bindings, DAS/ARR, audio, themes; persisted locally.
- Accessibility: high contrast theme, color‑blind palettes, focus order, ARIA for menus.

## Architecture

- Rendering: gameplay drawn in Canvas via `CanvasRenderer`.
- React UI overlays: positioned above canvas; no heavy re‑renders; subscribe to engine snapshots/events.
- State: minimal app/UI state via a lightweight store (Zustand) or React Context; game state remains in the engine.
- Scenes: Boot → Main Menu → Play → Pause → Game Over → Settings → (optional) About/Help.
- Persistence: settings in `localStorage` with schema/version.

## Components (packages/web/src/ui)

- AppShell: root layout; hosts `GameCanvas` and overlays for scenes.
- GameCanvas: the canvas host (already present) + HUD overlay mount point.
- HUD
  - ScoreLevel: shows score, level, lines.
  - NextQueue: renders next N pieces as mini previews.
  - HoldBox: shows held piece; highlight if hold available.
  - StatusToasts: transient messages (B2B, Combo, Tetris) optional.
- Menus
  - MainMenu: Play, Settings, Help, Quit (if PWA/native later).
  - PauseMenu: Resume, Restart, Settings, Main Menu.
  - GameOverScreen: Final score/lines/level, Restart, Main Menu.
- Settings
  - ControlsPanel: key bindings, DAS/ARR; capture/edit bindings.
  - AudioPanel: master/music/sfx sliders, mute toggles.
  - VideoPanel: theme (light/dark/high‑contrast), cell scale (optional), animations toggle.
- Shared
  - Modal: focus trap, close on Escape, ARIA compliant.
  - Button, Toggle, Slider, Select: keyboard accessible inputs.
  - PiecePreview: draws a mini piece/board (Canvas or inline SVG) for Next/Hold.

## Interactions & Flows

- Start: Main Menu → Play transitions to Game scene; `GameHost` starts.
- Pause: `Escape` toggles pause; freeze updates but keep rendering; show PauseMenu.
- Game Over: engine emits `GameOver`; overlay with results; offer Restart.
- Settings: pause game when opened; apply changes live (DAS/ARR, bindings) via input source reconfig.
- Restart: resets engine with same/different seed; clear scores; maintain settings.

## HUD Data Flow

- Subscribe to `engine.getSnapshot()` in a throttled hook (e.g., on each rAF draw or with animation frame event) to avoid extra renders.
- Alternatively, listen to `EngineEvent`s to update HUD counters (ScoreChanged, LevelChanged, LinesCleared) without polling.
- Avoid reflow: use absolute‑positioned HUD containers over the canvas.

## Styling & Theming

- CSS variables for theme tokens: colors, shadows, spacing.
- Themes: default, dark, high‑contrast, color‑blind friendly palettes for tetrominoes.
- Respect prefers‑color‑scheme; allow override in settings.

## Accessibility

- Menus navigable with keyboard (Tab/Shift+Tab/Arrow keys/Enter/Escape).
- Proper ARIA roles for menus, dialogs, sliders, toggles.
- Color contrast: ensure ≥ 4.5:1 for HUD and text.
- Motion sensitivity: animation toggle; reduce flashing.

## Persistence

- `localStorage` key: `tetris:settings:v1`.
- Schema: `{ bindings, DAS, ARR, audio: { master, music, sfx }, theme, allow180 }`.
- Load on boot; validate with defaults; migrate minor versions if needed.

## Tests

- Unit (Vitest + React Testing Library):
  - Settings store loads/saves defaults and custom values.
  - Key binding editor: captures and updates mapping; prevents duplicates.
  - Pause flow: pressing Escape toggles paused state; GameHost stops updates.
- E2E (Playwright):
  - Start game, pause/resume, open settings, change DAS/ARR, verify behavior.
  - Restart game; verify counters reset.
  - Resize window; HUD remains positioned and legible.

## Implementation Tasks

1) UI State Store: settings + scene state (menu/pause/game over) and persistence helpers.
2) HUD: ScoreLevel, NextQueue, HoldBox; hook to engine snapshots/events.
3) Scene Overlays: MainMenu, PauseMenu, GameOverScreen; wire keyboard navigation.
4) Settings UI: ControlsPanel (bindings + DAS/ARR), AudioPanel, VideoPanel; persist + apply.
5) Theming: CSS variables and theme switcher; high‑contrast palette for tetrominoes.
6) Accessibility: Modal focus trap, ARIA attributes, Escape to close, focus return.
7) Tests: unit for store and components; Playwright scenarios for flows.

## Milestones

- U1 (HUD & Pause): HUD elements; pause/resume flow; minimal styling.
- U2 (Settings Core): bindings editor, DAS/ARR, audio; persistence.
- U3 (Themes & A11y): theme switcher, high‑contrast palette, focus/accessibility polish.
- U4 (Polish): animations/juice toggle, toasts for B2B/Combo/Tetris, help screen.

## Risks & Mitigations

- Performance: throttle HUD updates to animation frames; avoid large React trees.
- Input conflicts: focus trapping in modals to avoid gameplay input bleed‑through.
- Persistence corruption: validate settings schema with defaults & fallback.

