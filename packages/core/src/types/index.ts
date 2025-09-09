/**
 * Shared core engine types and interfaces.
 * All public APIs include TSDoc docstrings per project guidelines.
 */

/** Unique identifier for the seven tetromino types. */
export type TetrominoId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Rotation value: 0=spawn, 1=right, 2=reverse, 3=left. */
export type Rotation = 0 | 1 | 2 | 3;

/** Immutable 2D integer coordinate. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/**
 * Immutable description of the active piece state.
 */
export interface PieceState {
  readonly id: TetrominoId;
  readonly position: Vec2; // top-left origin increasing down-right
  readonly rotation: Rotation;
}

/** Normalized input command with timestamp (ms). */
export type InputEvent =
  | { type: 'MoveLeft'; at: number }
  | { type: 'MoveRight'; at: number }
  | { type: 'RotateCW'; at: number }
  | { type: 'RotateCCW'; at: number }
  | { type: 'Rotate180'; at: number }
  | { type: 'SoftDropStart'; at: number }
  | { type: 'SoftDropStop'; at: number }
  | { type: 'HardDrop'; at: number }
  | { type: 'Hold'; at: number };

/** Engine configuration values. */
export interface EngineConfig {
  readonly width: number; // board width in cells
  readonly heightVisible: number; // visible rows
  readonly bufferRows: number; // hidden rows on top for spawn
  readonly allow180: boolean; // enable 180 rotation input
  readonly lockDelayMs: number; // milliseconds of lock delay
  readonly maxLockResets: number; // how many resets allowed
  /**
   * Gravity speed per level in cells per second. Levels beyond the last key use the last value.
   */
  readonly gravityTable: Readonly<Record<number, number>>;
  readonly showNext: number; // next queue display count
  /**
   * Scoring configuration for clears, drops, and level progression.
   */
  readonly scoring: {
    readonly single: number;
    readonly double: number;
    readonly triple: number;
    readonly tetris: number;
    readonly softPerCell: number;
    readonly hardPerCell: number;
    readonly b2bMultiplier: number;
    readonly comboBase: number;
    readonly levelLines: number;
  };
}

/**
 * Render-friendly snapshot of current engine state.
 */
export interface Snapshot {
  readonly board: Uint8Array; // flattened grid including buffer rows
  readonly width: number;
  readonly heightVisible: number;
  readonly bufferRows: number;
  readonly active: PieceState | null;
  readonly ghost: readonly Vec2[] | null;
  readonly hold: TetrominoId | null;
  readonly canHold: boolean;
  readonly next: readonly TetrominoId[];
  readonly timers: { readonly lockMsLeft: number | null };
  /** Total score accumulated so far. */
  readonly score: number;
  /** Current level. */
  readonly level: number;
  /** Total cleared lines. */
  readonly linesClearedTotal: number;
}

/** Engine events for observers (UI/audio). */
export type EngineEvent =
  | { type: 'PieceSpawned'; id: TetrominoId }
  | { type: 'PieceMoved' }
  | { type: 'PieceRotated' }
  | { type: 'HardDropped' }
  | { type: 'Locked' }
  | { type: 'LinesCleared'; count: number; rows: number[]; b2b?: boolean; combo?: number }
  | { type: 'ScoreChanged'; delta: number; score: number }
  | { type: 'LevelChanged'; level: number }
  | { type: 'GameOver' };
