/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { CanvasRenderer } from './CanvasRenderer';

const makeSnapshot = () => {
  const width = 10;
  const heightVisible = 20;
  const bufferRows = 2;
  const board = new Uint8Array(width * (heightVisible + bufferRows));
  // Place a few blocks in visible bottom row
  const y = bufferRows + heightVisible - 1;
  board[y * width + 4] = 3;
  board[y * width + 5] = 6;
  return {
    board,
    width,
    heightVisible,
    bufferRows,
    active: { id: 'O', position: { x: 4, y: bufferRows }, rotation: 0 as const },
    ghost: null,
    hold: null,
    canHold: true,
    next: ['I', 'T', 'S'],
    timers: { lockMsLeft: null },
  };
};

describe('CanvasRenderer', () => {
  it('resizes with DPR and draws without throwing', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas);
    renderer.resize(200, 400, 2);
    const snap = makeSnapshot() as unknown as import('@tetris/core').Snapshot;
    expect(() => renderer.draw(snap)).not.toThrow();
    renderer.dispose();
  });
});
