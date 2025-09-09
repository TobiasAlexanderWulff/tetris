import type { Rotation, TetrominoId, Vec2 } from '../types';

/**
 * Defines tetromino cell offsets for each rotation.
 * Coordinates are relative to piece origin in SRS coordinates.
 */
export type ShapeOffsets = Readonly<Record<Rotation, readonly Vec2[]>>;

/** Offsets for JLSTZ and T share standard SRS 4-cell shapes. */
const O: ShapeOffsets = {
  0: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  1: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  2: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  3: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
};

const I: ShapeOffsets = {
  0: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ],
  1: [
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ],
  2: [
    { x: -1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  3: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
  ],
};

const T: ShapeOffsets = {
  0: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ],
  1: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
  ],
  2: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
  ],
  3: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ],
};

const J: ShapeOffsets = {
  0: [
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ],
  1: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  2: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
  ],
  3: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: -1 },
  ],
};

const L: ShapeOffsets = {
  0: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
  1: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: -1 },
  ],
  2: [
    { x: -1, y: -1 },
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ],
  3: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 1 },
  ],
};

const S: ShapeOffsets = {
  0: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: 1 },
  ],
  1: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
  2: [
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 0 },
    { x: 0, y: 0 },
  ],
  3: [
    { x: -1, y: -1 },
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
  ],
};

const Z: ShapeOffsets = {
  0: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  1: [
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
  ],
  2: [
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ],
  3: [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
  ],
};

/** Lookup of shape cell offsets per tetromino id. */
export const TETROMINO_SHAPES: Readonly<Record<TetrominoId, ShapeOffsets>> = {
  I,
  O,
  T,
  S,
  Z,
  J,
  L,
};
