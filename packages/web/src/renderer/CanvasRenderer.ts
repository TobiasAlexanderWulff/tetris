import type { Snapshot, Vec2 } from '@tetris/core';
import { TETROMINO_SHAPES } from '@tetris/core';
import { computeBoardLayout } from './layout';
import { colorForCell } from './colors';
import type { IRenderer } from '../game/types';

/**
 * CanvasRenderer draws a Snapshot onto a CanvasRenderingContext2D at 60 FPS.
 * It handles HiDPI scaling, centering, and minimal batching.
 */
export class CanvasRenderer implements IRenderer {
  private ctx: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  /** Resize the canvas backing store and set DPR transform. */
  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Draw the entire frame from the snapshot. */
  draw(s: Snapshot): void {
    const ctx = this.ctx;
    if (!ctx) return;

    // Background
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#0f0f12';
    ctx.fillRect(0, 0, this.width, this.height);

    const layout = computeBoardLayout(this.width, this.height, s.width, s.heightVisible, 0);

    // Grid lines
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    for (let x = 0; x <= layout.cols; x++) {
      const px = layout.ox + x * layout.cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, layout.oy + 0.5);
      ctx.lineTo(px, layout.oy + layout.bh + 0.5);
      ctx.stroke();
    }
    for (let y = 0; y <= layout.rows; y++) {
      const py = layout.oy + y * layout.cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(layout.ox + 0.5, py);
      ctx.lineTo(layout.ox + layout.bw + 0.5, py);
      ctx.stroke();
    }

    // Cell draw helper
    const drawCell = (x: number, y: number, color: string, alpha = 1) => {
      if (x < 0 || x >= layout.cols || y < 0 || y >= layout.rows) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(
        layout.ox + x * layout.cell + 1,
        layout.oy + y * layout.cell + 1,
        layout.cell - 2,
        layout.cell - 2,
      );
      ctx.globalAlpha = 1;
    };

    // Placed board (skip buffer rows)
    const totalRows = s.heightVisible + s.bufferRows;
    for (let y = s.bufferRows; y < totalRows; y++) {
      for (let x = 0; x < layout.cols; x++) {
        const v = s.board[y * layout.cols + x];
        if (v) drawCell(x, y - s.bufferRows, colorForCell(v));
      }
    }

    // Ghost piece
    if (s.ghost) {
      for (const c of s.ghost as readonly Vec2[]) {
        if (c.y >= s.bufferRows) drawCell(c.x, c.y - s.bufferRows, '#94a3b8', 0.35);
      }
    }

    // Active piece using core shapes
    if (s.active) {
      const id = s.active.id;
      const rotation = s.active.rotation as 0 | 1 | 2 | 3;
      const offsets = TETROMINO_SHAPES[id][rotation];
      const color = colorForCell(
        id === 'I'
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
          : 7,
      );
      for (const c of offsets) {
        const ax = s.active.position.x + c.x;
        const ay = s.active.position.y + c.y;
        if (ay >= s.bufferRows) drawCell(ax, ay - s.bufferRows, color);
      }
    }
  }

  dispose(): void {
    // no-op
  }
}

