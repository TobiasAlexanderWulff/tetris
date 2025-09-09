
/**
 * Supported input actions mapped from keyboard.
 */
export type InputAction =
  | 'Left'
  | 'Right'
  | 'RotateCW'
  | 'RotateCCW'
  | 'Rotate180'
  | 'SoftDrop'
  | 'HardDrop'
  | 'Hold'
  | 'Pause';

/**
 * Key binding by KeyboardEvent.code to an action.
 */
export interface KeyBinding {
  readonly code: string;
  readonly action: InputAction;
}

/**
 * Input configuration for DAS/ARR and bindings.
 */
export interface InputConfig {
  readonly DAS: number; // ms
  readonly ARR: number; // ms
  readonly allow180: boolean; // whether to emit Rotate180 if bound
  readonly bindings: readonly KeyBinding[];
}

/**
 * Normalized event queue item (type only). Timestamp is supplied during poll.
 */
export type PendingEvent =
  | 'MoveLeft'
  | 'MoveRight'
  | 'RotateCW'
  | 'RotateCCW'
  | 'Rotate180'
  | 'SoftDropStart'
  | 'SoftDropStop'
  | 'HardDrop'
  | 'Hold';

/** Default input config with Arrow keys. */
export const DEFAULT_INPUT: InputConfig = {
  DAS: 150,
  ARR: 33,
  allow180: false,
  bindings: [
    { code: 'ArrowLeft', action: 'Left' },
    { code: 'ArrowRight', action: 'Right' },
    { code: 'ArrowUp', action: 'RotateCW' },
    { code: 'KeyZ', action: 'RotateCCW' },
    { code: 'KeyX', action: 'RotateCW' },
    { code: 'KeyC', action: 'Rotate180' },
    { code: 'Space', action: 'HardDrop' },
    { code: 'ShiftLeft', action: 'Hold' },
    { code: 'ArrowDown', action: 'SoftDrop' },
    // Pause handled by UI layer; not emitted to engine
  ],
};
