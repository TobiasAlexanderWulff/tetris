/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// Shared mock state, declared via vi.hoisted so the hoisted vi.mock factory can use it.
const hostState = vi.hoisted(() => ({
  pausedCalls: [] as boolean[],
  score: 0,
  level: 0,
  lines: 0,
}));

// Mock highscore API to observe calls
vi.mock('../highscore', () => {
  return {
    initHighscores: vi.fn(),
    maybeSubmit: vi.fn(() => ({ added: true, rank: 1 })),
    getHighscores: vi.fn(() => []),
  };
});

// Mock GameHost and engine to trigger a GameOver event immediately after start
vi.mock('../game/GameHost', () => {
  type EngineEvent = { type: 'GameOver' } | Record<string, unknown>;
  interface EngineMock {
    subscribe(cb: (e: EngineEvent) => void): () => void;
    getSnapshot(): {
      board: Uint8Array;
      width: number;
      heightVisible: number;
      bufferRows: number;
      active: unknown;
      ghost: unknown;
      hold: unknown;
      canHold: boolean;
      next: unknown[];
      timers: { lockMsLeft: number | null };
      score: number;
      level: number;
      linesClearedTotal: number;
    };
    _emit(e: EngineEvent): void;
  }

  class GameHostMock {
    constructor(
      public canvas: HTMLCanvasElement,
      public engine: EngineMock,
    ) {}
    start() {
      // Trigger a final scoring tick followed by game over in the same drain.
      // React state/refs would still be stale here; the host must read the
      // engine snapshot instead.
      setTimeout(() => {
        hostState.score = 4321;
        hostState.level = 7;
        hostState.lines = 42;
        this._emit({ type: 'ScoreChanged', delta: 4321, score: 4321 });
        this._emit({ type: 'LevelChanged', level: 7 });
        this._emit({ type: 'LinesCleared', count: 42, rows: [], b2b: false, combo: 0 });
        this._emit({ type: 'GameOver' });
      }, 0);
    }
    setPaused(p: boolean) {
      hostState.pausedCalls.push(p);
    }
    dispose() {}
    // Helpers for tests
    _emit: (e: EngineEvent) => void = () => {};
  }

  function createDefaultEngine() {
    let listener: ((e: EngineEvent) => void) | null = null;
    const engine: EngineMock = {
      subscribe(cb: (e: EngineEvent) => void) {
        listener = cb;
        return () => {
          listener = null;
        };
      },
      getSnapshot() {
        return {
          board: new Uint8Array(),
          width: 10,
          heightVisible: 20,
          bufferRows: 2,
          active: null,
          ghost: null,
          hold: null,
          canHold: true,
          next: [],
          timers: { lockMsLeft: null },
          score: hostState.score,
          level: hostState.level,
          linesClearedTotal: hostState.lines,
        };
      },
      // expose a way for host to emit events
      _emit(e: EngineEvent) {
        listener?.(e);
      },
    };
    return engine;
  }

  // Monkey patch to connect host._emit with engine._emit in our mock
  const hostFactory = {
    GameHost: class extends GameHostMock {
      constructor(canvas: HTMLCanvasElement, engine: EngineMock) {
        super(canvas, engine);
        // bind emit so start() can emit to engine subscriber
        this._emit = (e: EngineEvent) => engine._emit(e);
      }
    },
    createDefaultEngine,
  };
  return hostFactory;
});

// Mock renderer, input, and effects to minimal no-ops
vi.mock('../renderer/CanvasRenderer', () => ({
  CanvasRenderer: class {
    constructor() {}
    setEffects() {}
    draw() {}
    resize() {}
    dispose() {}
    setPalette() {}
  },
}));
vi.mock('../input/KeyboardInput', () => ({
  KeyboardInput: class {
    constructor() {}
    attach() {}
    detach() {}
    reset() {}
    poll() {
      return [];
    }
    updateConfig() {}
  },
}));
vi.mock('../effects/Effects', () => ({
  EffectScheduler: class {
    setEnabled() {}
    setAllowParticles() {}
    onLinesCleared() {}
    onPieceSpawned() {}
  },
}));

import { GameCanvas } from './GameCanvas';
import { maybeSubmit } from '../highscore';

describe('GameCanvas highscore integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hostState.pausedCalls.length = 0;
    hostState.score = 0;
    hostState.level = 0;
    hostState.lines = 0;
  });

  afterEach(() => {
    cleanup();
  });

  it('submits the final snapshot values on Game Over', async () => {
    render(<GameCanvas />);
    await waitFor(() => expect(maybeSubmit).toHaveBeenCalledTimes(1));
    expect(maybeSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ score: 4321, lines: 42, level: 7, mode: 'marathon' }),
    );
  });

  it('ignores Escape after game over instead of resuming the host', async () => {
    render(<GameCanvas />);
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await screen.findByLabelText('game-over');

    hostState.pausedCalls.length = 0;
    fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });

    expect(hostState.pausedCalls).toEqual([]);
    expect(screen.getByLabelText('game-over')).toBeTruthy();
    expect(screen.queryByLabelText('pause-overlay')).toBeNull();
  });
});
