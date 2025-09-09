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
  - NextQueue: renders next N pieces as mini previews (tiny Canvas or SVG). Uses core shapes; respects theme palette.
  - HoldBox: shows held piece; highlight if hold available and dim when hold not allowed.
  - StatusToasts: transient messages (B2B, Combo, Tetris); suppressed when animations are off or prefers-reduced-motion.
- Menus
  - MainMenu: Play, Settings, Help, Quit (if PWA/native later).
  - PauseMenu: Resume, Restart, Settings, Main Menu.
  - GameOverScreen: Final score/lines/level, Restart, Main Menu.
- Settings
  - ControlsPanel: key bindings, DAS/ARR; capture/edit bindings.
  - AudioPanel: master/music/sfx sliders, mute toggles.
  - VideoPanel: theme (light/dark/high‑contrast), cell scale (optional), animations toggle; reduced-motion auto setting.
- Shared
  - Modal: focus trap, close on Escape, ARIA compliant.
  - Button, Toggle, Slider, Select: keyboard accessible inputs.
  - PiecePreview: draws a mini piece/board (Canvas or inline SVG) for Next/Hold.
  - TouchControls (mobile): optional on-screen controls (d-pad/rotate/drop/hold) with opacity and layout presets; disable when keyboard present.

## Interactions & Flows

- Start: Main Menu → Play transitions to Game scene; `GameHost` starts.
- Pause: `Escape` toggles pause; freeze updates but keep rendering; show PauseMenu.
- Game Over: engine emits `GameOver`; overlay with results; offer Restart.
- Settings: pause game when opened; apply changes live (DAS/ARR, bindings) via input source reconfig.
- Restart: resets engine with same/different seed; clear scores; maintain settings.

## HUD Data Flow

- Subscribe to `engine.getSnapshot()` in a throttled hook (e.g., on each rAF draw or with animation frame event) to avoid extra renders.
- Prefer listening to `EngineEvent`s to update HUD counters (ScoreChanged, LevelChanged, LinesCleared) without polling large snapshots.
- Avoid reflow: use absolute‑positioned HUD containers over the canvas.
 - FPS indicator (dev toggle): small overlay to diagnose performance; disabled in production.

## Styling & Theming

- CSS variables for theme tokens: colors, shadows, spacing; mapped to renderer palette for consistent board/HUD styling.
- Themes: default, dark, high‑contrast, color‑blind friendly palettes for tetrominoes.
- Respect prefers‑color‑scheme; allow override in settings.
- Prefer-reduced-motion: automatically disable animation effects unless explicitly overridden.

## Accessibility

- Menus navigable with keyboard (Tab/Shift+Tab/Arrow keys/Enter/Escape).
- Proper ARIA roles for menus, dialogs, sliders, toggles.
- Color contrast: ensure ≥ 4.5:1 for HUD and text.
- Motion sensitivity: animation toggle; reduce flashing.

## Persistence

- `localStorage` key: `tetris:settings:v1`.
- Schema: `{ bindings, das, arr, audio: { master, music, sfx, muted }, theme, allow180, animations }`.
- Load on boot; validate with defaults; migrate minor versions if needed.

## Tests

- Unit (Vitest + React Testing Library):
  - Settings store loads/saves defaults and custom values.
  - Key binding editor: captures and updates mapping; prevents duplicates.
  - Pause flow: pressing Escape toggles paused state; GameHost stops updates.
  - Theme switch updates CSS variables and renderer palette.
  - Animations flag suppresses StatusToasts/components with motion.
- E2E (Playwright):
  - Start game, pause/resume, open settings, change DAS/ARR, verify behavior.
  - Restart game; verify counters reset.
  - Resize window; HUD remains positioned and legible.
  - Toggle theme; verify contrast and board colors change.
  - Toggle animations; verify toasts and motion are disabled.
  - (Mobile) Enable touch controls; verify taps translate to moves/rotations.

## Implementation Tasks

1) UI State Store: settings + scene state (menu/pause/game over) and persistence helpers.
2) HUD: ScoreLevel, NextQueue, HoldBox; hook to engine events; throttle snapshot reads for previews.
3) Scene Overlays: MainMenu, PauseMenu, GameOverScreen; wire keyboard navigation.
4) Settings UI: ControlsPanel (bindings + DAS/ARR), AudioPanel, VideoPanel; persist + apply; add key capture overlay for binding changes and conflict detection.
5) Theming: CSS variables and theme switcher; high‑contrast palette for tetrominoes.
6) Accessibility: Modal focus trap, ARIA attributes, Escape to close, focus return; auto-disable animations with prefers-reduced-motion.
7) Touch Controls (mobile): basic layout, hit areas, configurable opacity and positions.
8) Tests: unit for store and components; Playwright scenarios for flows; perf sanity (FPS budget smoke).

## Milestones

- U1 (HUD & Pause): HUD elements; pause/resume flow; minimal styling. Acceptance: can pause/resume; HUD updates via events.
- U2 (Settings Core): bindings editor, DAS/ARR, audio; persistence. Acceptance: settings persist and apply live (input + audio stubs).
- U3 (Themes & A11y): theme switcher, high‑contrast palette, focus/accessibility polish. Acceptance: theme updates board/HUD; a11y checks pass.
- U4 (Polish): animations/juice toggle, toasts for B2B/Combo/Tetris, help screen. Acceptance: motion disables toasts/animations; help modal documents controls.

## Risks & Mitigations

- Performance: throttle HUD updates to animation frames; avoid large React trees.
- Input conflicts: focus trapping in modals to avoid gameplay input bleed‑through.
- Persistence corruption: validate settings schema with defaults & fallback.
 - Mobile latency: debounce touch inputs minimally; provide adjustable sensitivity.
 - Color-blind accessibility: provide alternate palettes and user overrides.
