/**
 * Layout helpers to size and position the playfield within the canvas.
 */

export interface BoardLayout {
  readonly cell: number;
  readonly cols: number;
  readonly rows: number;
  readonly ox: number; // origin x in CSS pixels
  readonly oy: number; // origin y in CSS pixels
  readonly bw: number; // board width in CSS pixels
  readonly bh: number; // board height in CSS pixels
}

/**
 * Compute a centered board layout given canvas size and board dimensions.
 * Adds optional padding in CSS pixels around the board.
 */
export function computeBoardLayout(
  width: number,
  height: number,
  cols: number,
  rows: number,
  padding = 0,
): BoardLayout {
  const innerW = Math.max(0, width - padding * 2);
  const innerH = Math.max(0, height - padding * 2);
  const cell = Math.max(1, Math.floor(Math.min(innerW / cols, innerH / rows)));
  const bw = cell * cols;
  const bh = cell * rows;
  const ox = Math.floor((width - bw) / 2);
  const oy = Math.floor((height - bh) / 2);
  return { cell, cols, rows, ox, oy, bw, bh };
}

