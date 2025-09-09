import React, { useEffect, useRef } from 'react';
import { createDefaultEngine, GameHost } from '../game/GameHost';
import type { IRenderer } from '../game/types';
import { KeyboardInput } from '../input/KeyboardInput';
import type { Snapshot } from '@tetris/core';

/**
 * Minimal renderer for M2 host integration.
 * Draws grid background, placed cells, active piece, and ghost.
 */
class BasicRenderer implements IRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0;
  private h = 0;
  private dpr = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  resize(width: number, height: number, dpr: number): void {
    this.w = width;
    this.h = height;
    this.dpr = dpr;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(s: Snapshot): void {
    const ctx = this.ctx;
    if (!ctx) return;
    // Background
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = '#0f0f12';
    ctx.fillRect(0, 0, this.w, this.h);

    // Compute cell size and board rect centered
    const cols = s.width;
    const rows = s.heightVisible;
    const cell = Math.floor(Math.min(this.w / cols, this.h / rows));
    const bw = cell * cols;
    const bh = cell * rows;
    const ox = Math.floor((this.w - bw) / 2);
    const oy = Math.floor((this.h - bh) / 2);

    // Grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      const px = ox + x * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, oy + 0.5);
      ctx.lineTo(px, oy + bh + 0.5);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      const py = oy + y * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(ox + 0.5, py);
      ctx.lineTo(ox + bw + 0.5, py);
      ctx.stroke();
    }

    // Helper to draw a cell
    const drawCell = (x: number, y: number, color: string, alpha = 1) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * cell + 1, oy + y * cell + 1, cell - 2, cell - 2);
      ctx.globalAlpha = 1;
    };

    // Placed board (skip buffer rows)
    const totalRows = s.heightVisible + s.bufferRows;
    for (let y = s.bufferRows; y < totalRows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = s.board[y * cols + x];
        if (v) drawCell(x, y - s.bufferRows, colorFor(v));
      }
    }

    // Ghost
    if (s.ghost) {
      for (const c of s.ghost) {
        if (c.y >= s.bufferRows) drawCell(c.x, c.y - s.bufferRows, '#94a3b8', 0.35);
      }
    }

    // Active
    if (s.active) {
      const id = idColor(s.active.id);
      const shape = getShapeOffsets(s.active);
      for (const c of shape) {
        const ax = s.active.position.x + c.x;
        const ay = s.active.position.y + c.y;
        if (ay >= s.bufferRows) drawCell(ax, ay - s.bufferRows, id);
      }
    }
  }

  dispose(): void {
    // nothing to dispose for basic renderer
  }
}

/** Map encoded board values to colors. */
function colorFor(v: number): string {
  switch (v) {
    case 1:
      return '#00f0f0';
    case 2:
      return '#f0f000';
    case 3:
      return '#a000f0';
    case 4:
      return '#00f000';
    case 5:
      return '#f00000';
    case 6:
      return '#0000f0';
    case 7:
      return '#f0a000';
    default:
      return 'transparent';
  }
}

/** Get color for active piece id. */
function idColor(id: string): string {
  return colorFor(
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
}

/** Resolve shape offsets for active piece from snapshot. */
function getShapeOffsets(active: Snapshot['active']): { x: number; y: number }[] {
  // Very rough approximations for MVP drawing; proper shapes will come from renderer module.
  const id = active?.id;
  if (id === 'I') return [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
  if (id === 'O') return [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
  if (id === 'T') return [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
  if (id === 'S') return [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }];
  if (id === 'Z') return [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
  if (id === 'J') return [{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }];
  // L
  return [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }];
}

// KeyboardInput is now used; no no-op input needed.

/**
 * GameCanvas mounts the game host: engine + renderer + input.
 */
export function GameCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<GameHost | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = createDefaultEngine();
    const renderer = new BasicRenderer(canvas);
    const input = new KeyboardInput();
    const host = new GameHost(canvas, engine, renderer, input);
    hostRef.current = host;
    host.start();
    return () => {
      host.dispose();
      hostRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
