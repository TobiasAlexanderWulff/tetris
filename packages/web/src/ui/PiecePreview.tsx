import React from 'react';
import type { TetrominoId } from '@tetris/core';
import { TETROMINO_SHAPES } from '@tetris/core';
import type { Palette } from '../renderer/colors';

/** Map tetromino id to numeric cell value for palette lookup. */
function idToVal(id: TetrominoId): number {
  return id === 'I'
    ? 1
    : id === 'O'
    ? 2
    : id === 'T'
    ? 3
    : id === 'S'
    ? 4
    : id === 'Z'
    ? 5
    : id === 'J'
    ? 6
    : 7;
}

/**
 * PiecePreview renders a mini preview of a tetromino using SVG.
 * It fits the 4 cells into the given width/height, respecting theme palette.
 */
export function PiecePreview({
  id,
  palette,
  width = 48,
  height = 48,
  dim = false,
}: {
  id: TetrominoId | null;
  palette: Palette;
  width?: number;
  height?: number;
  dim?: boolean;
}): JSX.Element {
  const cells = React.useMemo(() => {
    if (!id) return [] as { x: number; y: number }[];
    return TETROMINO_SHAPES[id][0];
  }, [id]);

  // Compute bounds
  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0;
  for (const c of cells) {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y);
    maxY = Math.max(maxY, c.y);
  }
  const cols = maxX - minX + 1 || 1;
  const rows = maxY - minY + 1 || 1;
  const cell = Math.floor(Math.min(width / cols, height / rows));
  const offX = Math.floor((width - cols * cell) / 2) - minX * cell;
  const offY = Math.floor((height - rows * cell) / 2) - minY * cell;
  const opacity = dim ? 0.4 : 1;
  const fill = id ? palette.cells[idToVal(id)] : 'transparent';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="piece-preview">
      {cells.map((c, i) => (
        <rect
          key={i}
          x={offX + c.x * cell + 1}
          y={offY + c.y * cell + 1}
          width={cell - 2}
          height={cell - 2}
          fill={fill}
          opacity={opacity}
          rx={Math.max(2, Math.floor(cell * 0.15))}
          ry={Math.max(2, Math.floor(cell * 0.15))}
        />
      ))}
    </svg>
  );
}

