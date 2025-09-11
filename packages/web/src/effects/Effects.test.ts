import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectScheduler } from './Effects';
import type { Snapshot } from '@tetris/core';
import { getPalette } from '../renderer/colors';

type VMock = ReturnType<typeof vi.fn>;
type MockWithCalls = VMock & { mock: { calls: unknown[] } } & { mockClear: () => void };

interface MockCtx
  extends Pick<
    CanvasRenderingContext2D,
    'save' | 'restore' | 'translate' | 'scale' | 'fillRect' | 'getTransform'
  > {
  canvas: { width: number; height: number };
  fillStyle: string;
  strokeStyle: string;
  globalAlpha: number;
  fillRect: MockWithCalls;
  save: VMock;
  restore: VMock;
  translate: VMock;
  scale: VMock;
  getTransform: () => { a: number; d: number };
}

function makeCtx(width = 200, height = 400): MockCtx {
  return {
    canvas: { width, height },
    fillStyle: '#000',
    strokeStyle: '#000',
    globalAlpha: 1,
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn() as MockWithCalls,
    getTransform: () => ({ a: 1, d: 1 }),
  } satisfies MockCtx;
}

function makeSnapshot(): Snapshot {
  return {
    board: new Uint8Array(10 * (20 + 2)),
    width: 10,
    heightVisible: 20,
    bufferRows: 2,
    active: { id: 'T', position: { x: 4, y: 2 }, rotation: 0 },
    ghost: null,
    hold: null,
    canHold: true,
    next: ['I', 'O', 'S'],
    timers: { lockMsLeft: null },
    score: 0,
    level: 0,
    linesClearedTotal: 0,
  };
}

describe('EffectScheduler', () => {
  beforeEach(() => {
    // no-op
  });

  it('renders line flash during active window and cleans up after', () => {
    const eff = new EffectScheduler();
    eff.setEnabled(true);
    const ctx = makeCtx();
    const snap = makeSnapshot();

    // Clear bottom visible row (index includes bufferRows)
    const rowIdx = snap.bufferRows + snap.heightVisible - 1;
    eff.onLinesCleared([rowIdx], 0);

    // Midway through effect
    eff.render(ctx, snap, getPalette('dark'), 60);
    expect((ctx.fillRect as MockWithCalls).mock.calls.length).toBeGreaterThan(0);

    // Expired: no further draws and cleaned up
    (ctx.fillRect as MockWithCalls).mockClear();
    eff.render(ctx, snap, getPalette('dark'), 500);
    expect((ctx.fillRect as MockWithCalls).mock.calls.length).toBe(0);
  });

  it('renders spawn pop and then expires', () => {
    const eff = new EffectScheduler();
    eff.setEnabled(true);
    const ctx = makeCtx();
    const snap = makeSnapshot();

    eff.onPieceSpawned('T', { x: 4, y: 2 }, 0, 0);
    eff.render(ctx, snap, getPalette('dark'), 60);
    expect((ctx.fillRect as MockWithCalls).mock.calls.length).toBeGreaterThan(0);

    (ctx.fillRect as MockWithCalls).mockClear();
    eff.render(ctx, snap, getPalette('dark'), 500);
    expect((ctx.fillRect as MockWithCalls).mock.calls.length).toBe(0);
  });

  it('does not render when disabled', () => {
    const eff = new EffectScheduler();
    eff.setEnabled(false);
    const ctx = makeCtx();
    const snap = makeSnapshot();
    eff.onLinesCleared([snap.bufferRows + 1], 0);
    eff.render(ctx, snap, getPalette('dark'), 60);
    expect((ctx.fillRect as MockWithCalls).mock.calls.length).toBe(0);
  });
});
