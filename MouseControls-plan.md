# Mouse Controls — Implementation Plan

## Goals

- Provide a mouse-only input scheme alongside existing keyboard input.
- Keep input modular: no changes to core engine, minimal changes to UI host.
- Respect existing settings (e.g., `allow180`) and add small mouse-specific settings behind a toggle.

## UX Mapping

- Move mouse horizontally over the playfield → horizontal piece moves by cells.
- Scroll up → Rotate CCW, scroll down → Rotate CW.
- Middle click (wheel button) → 180° spin (only if `allow180` is true).
- Left click → Hard drop.
- Right click (hold) → Soft drop start/stop.
- Left + Right pressed together (chord) → Hold piece.

## Architecture

- Add `MouseInput` implementing `IInputSource` with its own event queue.
  - Listeners: `pointermove`, `pointerdown`, `pointerup`, `pointerleave`, `wheel`, `contextmenu`.
  - Translate device events to normalized `InputEvent`s used by the engine.
  - Horizontal movement: convert pixels to cells using computed cell width from `computeBoardLayout`.
  - Chord detection: short window (~50 ms) to resolve L+R → `Hold` and suppress single-button effects.
  - Soft drop state persists while right button is held; ensure `SoftDropStop` on `pointerup/leave/reset`.
  - Prevent native scroll and context menu when interacting over the canvas.

- Add `MultiInput` to aggregate multiple `IInputSource` instances (keyboard + mouse) behind the existing contract.
  - `attach/detach/reset` fan-out; `poll(now)` concatenates events.
  - Keeps GameHost and core unaware of multiple inputs.

## Settings & Help (follow-up wiring)

- Settings additions (default enabled):
  - `mouseControls: boolean` (default: true)
  - `mouseSensitivityPxPerCell: number | 'auto'` (default: 'auto')
- UI updates:
  - SettingsModal: checkbox + optional sensitivity control.
  - HelpModal: add a “Mouse Controls” section with mapping text.

## Integration (follow-up wiring)

- In `GameCanvas.tsx`, construct `MultiInput([KeyboardInput, MouseInput])`.
- Attach keyboard to `window`, mouse to the `<canvas>` element.
- Propagate settings changes to `MouseInput.updateConfig`.

## Tests

- `MouseInput.test.ts`:
  - Emits `MoveLeft/MoveRight` based on `pointermove` distances; honors deadzone and caps bursts.
  - Emits rotations on `wheel` up/down; prevents default.
  - Emits `Rotate180` on middle click only when `allow180=true`.
  - Emits `SoftDropStart/Stop` on right down/up and on `pointerleave`.
  - Emits `HardDrop` on left click.
  - Chord within window emits `Hold` and suppresses individual drops; stops soft drop if active.
- `MultiInput.test.ts`:
  - Aggregates queues from two stub inputs; forwards `reset`.

## Out of Scope for this step

- Full wiring into settings and GameCanvas (will be in a separate task after scaffolding is reviewed).
- Touch/mobile gestures (separate plan).

## Risks & Mitigations

- Over-eager horizontal movement on high DPI mice → deadzone + max burst per poll.
- Browser defaults interfering → set `{ passive: false }` where needed and call `preventDefault()`.
- Pointer leaving canvas mid-soft-drop → ensure stop on `pointerleave` and on `reset()`.

