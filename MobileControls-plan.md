# Mobile & Touch Controls — Implementation Plan

## Goals
- Deliver a touch-first control scheme for the Tetris gameplay canvas that feels natural on phones and tablets while coexisting with keyboard and mouse input.
- Ensure primary menus and overlays (start, pause, settings, help, game over) remain fully operable via tap and accessible focus interactions without requiring a hardware keyboard or mouse.
- Keep changes modular so that touch handling lives beside the existing keyboard/mouse `IInputSource` implementations and GameCanvas wiring stays maintainable.

## Current State & Constraints
- `GameCanvas.tsx` wires together `KeyboardInput`, `MouseInput`, and `MultiInput`, with a mobile user detection flag already available for tailoring behavior.【F:packages/web/src/ui/GameCanvas.tsx†L1-L130】
- Overlays such as `StartOverlay` render with `pointerEvents: 'none'`, meaning taps on mobile cannot start the game, and similar overlays rely on divs styled as buttons without dedicated touch affordances.【F:packages/web/src/ui/StartOverlay.tsx†L12-L31】【F:packages/web/src/ui/PauseOverlay.tsx†L1-L77】
- No touch-specific input source exists yet; adding one should mirror the structure in `packages/web/src/input` so it can participate in `MultiInput` like other sources.【F:packages/web/src/input/MouseInput.ts†L1-L116】

## UX Mapping for Touch Gameplay
- **Drag horizontal (finger down on board, move left/right):** translate accumulated movement in board cells with dampening similar to mouse sensitivity.
- **Tap / quick lift on playfield:** rotate clockwise; secondary tap area (or two-finger tap) rotates counter-clockwise to preserve fast finesse.
- **Swipe down while holding:** start soft drop; release finger to stop.
- **Quick flick downward (high velocity) or dedicated drop button:** trigger hard drop to avoid accidental hard drops during slow drags.
- **Tap and hold on hold-area button or two-finger drag up:** trigger hold action without conflict with rotation gestures.
- **Optional on-screen buttons for rotate/hold/drop positioned under the board for small screens**, enabled only when touch controls are active.

## Architecture & Data Flow
1. **`TouchInput` class**: implement `IInputSource`, similar to `MouseInput`, but using pointer/touch events.
   - Attach to the canvas element; track pointer states and convert gestures into normalized `PendingEvent`s.
   - Maintain gesture state machine (touch start position/time, velocity, multi-touch detection) and respect configurable thresholds for movement, rotation taps, and flicks.
   - Provide configuration for enabling/disabling, sensitivity (px per cell), tap deadlines, and flick velocity thresholds.
2. **On-screen control widgets**: create lightweight React components rendered inside `GameCanvas` to expose explicit buttons for rotate left/right, hold, hard drop, and pause when a touch device is detected.
   - Buttons should call into `GameHost` via dispatching synthetic events (e.g., by calling helper functions that push events into `TouchInput` or by invoking host actions directly in a thin shim).
   - Layout should adapt to portrait vs landscape, leveraging existing settings/theme tokens.
3. **Menu adjustments**: update overlay components so that their primary actions can be triggered by tapping anywhere obvious (e.g., start overlay entire overlay clickable) and convert important div-based buttons into `<button>` elements with appropriate accessible styles.
4. **Settings & help integration**: extend `SettingsModal` to expose toggles for touch UI (enable/disable gestures, show on-screen buttons) and document gestures in `HelpModal` sections.
5. **GameCanvas wiring**: when mobile detection is true, instantiate `TouchInput`, add to `MultiInput`, and mount on-screen button layer. Respect settings updates by calling `touchInput.updateConfig` similar to mouse settings.

## Implementation Steps
1. **Scaffold `TouchInput`**
   - Create `TouchInput.ts` and tests verifying gesture detection (movement thresholds, tap vs swipe classification, multi-touch hold, flick-based hard drop).
   - Export from input index if needed for host wiring.
2. **Integrate with `GameCanvas`**
   - Instantiate `TouchInput` inside the GameCanvas effect when touch is supported; attach to canvas and set bounding element for layout math.
   - Update settings effect hooks to propagate allow180 and any new touch-related settings to the touch input instance.
   - Ensure `MultiInput` is created with keyboard + mouse + touch and gracefully falls back when touch disabled.
3. **On-screen buttons layer**
   - Build a `TouchControlsOverlay` component positioned over/under the canvas with configurable layout.
   - Hook button presses to dispatch actions (e.g., rotate, hold, hard drop, pause) by calling dedicated callbacks on `GameHost` or a new `useInputDispatcher` helper.
   - Add responsive styles (CSS modules or inline) and tests validating rendering on small widths.
4. **Menu & overlay touchability**
   - Update `StartOverlay` to use `pointerEvents: 'auto'` with a tappable region covering the overlay and call `onStart` via props.
   - Replace clickable divs in `PauseOverlay`, `SettingsModal`, `HelpModal`, and `GameOverOverlay` with semantic buttons and add minimum touch target sizes.
   - Add focus-visible and aria attributes to retain keyboard accessibility.
5. **Settings & help updates**
   - Extend settings state shape to include `touchControlsEnabled`, `showTouchButtons`, and thresholds.
   - Update persistence (localStorage) and default settings accordingly.
   - Document controls inside `HelpModal` with clear gesture descriptions.
6. **Polish & QA**
   - Tune default thresholds via manual play-testing on simulated mobile (e.g., browser dev tools) and adjust to avoid accidental triggers.
   - Ensure input sources can be reset/detached cleanly on unmount or canvas resize to avoid stuck touches.

## Testing Strategy
- Unit tests for `TouchInput` gesture translation, covering horizontal drift, soft drop activation/deactivation, hard drop flick detection, rotation tap timing, and hold gesture.
- Component tests for `TouchControlsOverlay` verifying button callbacks fire and respect disabled state.
- UI tests ensuring overlays respond to simulated touch events (React Testing Library `fireEvent.touchStart/End`).
- Manual checks on mobile simulator for layout, menu tap targets, and settings persistence.

## Risks & Mitigations
- **Gesture ambiguity**: Distinguish between tap-to-rotate vs drag-to-move via distance/time thresholds; provide settings to tune for advanced players.
- **Canvas size variability**: Use board layout utilities to convert pixels↔cells consistently (reuse `computeBoardLayout`).
- **Accessibility regressions**: Favor semantic buttons, keep keyboard bindings intact, and ensure touch additions do not interfere with screen readers.
- **Performance**: Batch events and avoid heavy calculations in pointer move handlers; reuse requestAnimationFrame for continuous drags if necessary.

## Follow-up Ideas (if needed)
- Haptic feedback hooks for compatible devices.
- Visual touch cues (highlight active columns, show ghost when dragging).
- Tutorial overlay guiding first-time mobile players through gestures.
