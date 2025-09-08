# Input — Plan (M2)

Purpose: Implement keyboard input mapping and a deterministic input repeater (DAS/ARR) that emits normalized `InputEvent`s to the core engine.

## Scope

- Keyboard mapping for: Left/Right, Rotate CW/CCW/(optional 180), Soft Drop, Hard Drop, Hold, Pause.
- DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate) for horizontal movement.
- Soft drop as a pressed state (start/stop events).
- Configurable bindings and DAS/ARR values (persist later in M4; defaults for M2).

## Public API (packages/web/src/input)

- `type KeyBinding = { code: string; action: InputAction }`.
- `type InputAction = 'Left'|'Right'|'RotateCW'|'RotateCCW'|'Rotate180'|'SoftDrop'|'HardDrop'|'Hold'|'Pause'`.
- `interface IInputSource`:
  - `attach(el: HTMLElement): void`
  - `detach(): void`
  - `poll(nowMs: number): InputEvent[]` — returns normalized events to enqueue into engine for the next tick, including DAS/ARR repeats.
- `class KeyboardInput implements IInputSource`:
  - `constructor(config?: Partial<InputConfig>)`

`InputConfig` defaults:
- `DAS = 150 ms`, `ARR = 33 ms`, soft drop multiplier handled by engine via SoftDropStart/Stop.
- Default bindings (WASD/Arrow friendly):
  - Left: `ArrowLeft` (alt: `KeyA`)
  - Right: `ArrowRight` (alt: `KeyD`)
  - RotateCW: `ArrowUp`/`KeyX`
  - RotateCCW: `KeyZ`
  - Rotate180: `KeyA` (off by default)
  - SoftDrop: `ArrowDown`
  - HardDrop: `Space`
  - Hold: `ShiftLeft`
  - Pause: `Escape`

## DAS/ARR Logic

- On keydown for Left/Right: emit one Move event immediately; start a held-state timer.
- After DAS expires, emit repeated Move events every ARR interval while key remains held.
- Only one horizontal direction repeats at a time; change of direction resets DAS.
- Keyup stops repeats immediately.
- SoftDrop emits Start on keydown, Stop on keyup.

## Files To Add

- `packages/web/src/input/KeyboardInput.ts`
- `packages/web/src/input/types.ts`
- `packages/web/src/input/KeyboardInput.test.ts`

## Tests

- Unit (Vitest + jsdom):
  - Keydown/keyup sequences produce correct `InputEvent`s over simulated time.
  - DAS followed by ARR cadence validated.
  - Direction flip resets DAS.
  - SoftDropStart/Stop pairing.

## Acceptance Criteria (M2)

- Keyboard controls are responsive and deterministic across browsers.
- DAS/ARR repeats feel consistent and match configured values.
- All unit tests for input pass reliably in CI.

## Risks & Mitigations

- Event repeat conflicts with browser auto-repeat: preventDefault and ignore native repeats; rely on our timer-driven repeat.
- Key ghosting: support alternate bindings; detect simultaneous opposite directions and choose last pressed.

