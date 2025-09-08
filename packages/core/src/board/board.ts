import type { Rotation, TetrominoId, Vec2 } from '../types';
import { TETROMINO_SHAPES } from '../pieces/tetromino';

/**
 * Board grid operations and collision helpers.
 */
export interface BoardSpec {
  readonly width: number;
  readonly heightVisible: number;
  readonly bufferRows: number;
}

/** Creates a new empty board grid including buffer rows. */
export function createGrid(spec: BoardSpec): Uint8Array {
  const totalRows = spec.heightVisible + spec.bufferRows;
  return new Uint8Array(spec.width * totalRows);
}

/** Returns true if the given cell is out of bounds. */
export function outOfBounds(spec: BoardSpec, x: number, y: number): boolean {
  const totalRows = spec.heightVisible + spec.bufferRows;
  return x < 0 || x >= spec.width || y < 0 || y >= totalRows;
}

/** Returns index into flattened array for (x,y). */
export function idx(spec: BoardSpec, x: number, y: number): number {
  return y * spec.width + x;
}

/**
 * Returns true if a piece at position+offsets collides with walls or occupied cells.
 */
export function collides(
  spec: BoardSpec,
  grid: Uint8Array,
  id: TetrominoId,
  rotation: Rotation,
  position: Vec2,
): boolean {
  const cells = TETROMINO_SHAPES[id][rotation];
  for (const c of cells) {
    const x = position.x + c.x;
    const y = position.y + c.y;
    if (outOfBounds(spec, x, y)) return true;
    if (grid[idx(spec, x, y)] !== 0) return true;
  }
  return false;
}

/** Writes the active piece blocks into the grid (locks). */
export function place(
  spec: BoardSpec,
  grid: Uint8Array,
  id: TetrominoId,
  rotation: Rotation,
  position: Vec2,
): void {
  const blocks = TETROMINO_SHAPES[id][rotation];
  const value = encodeId(id);
  for (const b of blocks) {
    const x = position.x + b.x;
    const y = position.y + b.y;
    grid[idx(spec, x, y)] = value;
  }
}

/** Clears any full rows, compacts, and returns cleared row indices (visible+buffer space). */
export function clearFullRows(spec: BoardSpec, grid: Uint8Array): number[] {
  const rows = spec.heightVisible + spec.bufferRows;
  const width = spec.width;
  const cleared: number[] = [];
  for (let y = 0; y < rows; y++) {
    let full = true;
    for (let x = 0; x < width; x++) {
      if (grid[idx(spec, x, y)] === 0) {
        full = false;
        break;
      }
    }
    if (full) cleared.push(y);
  }
  if (cleared.length === 0) return cleared;
  // Compact: for each cleared row, shift everything above it down by one
  for (const yClear of cleared) {
    for (let y = yClear; y > 0; y--) {
      for (let x = 0; x < width; x++) {
        const above = grid[idx(spec, x, y - 1)] ?? 0;
        grid[idx(spec, x, y)] = above;
      }
    }
    // topmost row becomes empty
    for (let x = 0; x < width; x++) grid[idx(spec, x, 0)] = 0;
  }
  return cleared;
}

/** Encodes a TetrominoId to a small integer 1..7. */
export function encodeId(id: TetrominoId): number {
  const map: Record<TetrominoId, number> = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 };
  return map[id];
}
