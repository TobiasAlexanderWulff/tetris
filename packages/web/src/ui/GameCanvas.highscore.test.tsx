/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

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
    constructor(public canvas: HTMLCanvasElement, public engine: EngineMock) {}
    start() {
      // trigger game over soon
      setTimeout(() => {
        this._emit({ type: 'GameOver' });
      }, 0);
    }
    setPaused() {}
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
          score: 0,
          level: 0,
          linesClearedTotal: 0,
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
    poll() { return []; }
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
  });

  it('submits a highscore on Game Over', async () => {
    render(<GameCanvas />);
    await waitFor(() => expect(maybeSubmit).toHaveBeenCalledTimes(1));
  });
});
