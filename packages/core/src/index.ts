/**
 * Core Tetris engine public API surface.
 *
 * This module intentionally contains only minimal scaffolding for M0.
 * Subsequent milestones will fill out models (Board, Piece), systems
 * (gravity, collision), and deterministic update loops with full tests.
 */

/** Unique identifier for the seven tetromino types. */
export type TetrominoId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/**
 * Readonly coordinate in board space.
 */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/**
 * Immutable description of a tetromino piece state.
 */
export interface PieceState {
  readonly id: TetrominoId;
  readonly position: Vec2;
  readonly rotation: 0 | 1 | 2 | 3;
}

/**
 * Minimal engine state placeholder used for early wiring and tests.
 */
export interface EngineState {
  readonly frame: number;
}

/**
 * Advance the engine by one frame.
 *
 * This placeholder simply increments a frame counter to support basic
 * wiring and unit testing in M0. It will be replaced by a fixed timestep
 * update that applies gravity, inputs, locking, and line clears.
 *
 * @param state - Current engine state
 * @returns Next engine state with frame incremented by one
 */
export function tick(state: EngineState): EngineState {
  return { frame: state.frame + 1 };
}

/**
 * Create a new minimal engine state.
 *
 * @returns EngineState with frame set to 0
 */
export function createEngineState(): EngineState {
  return { frame: 0 };
}

