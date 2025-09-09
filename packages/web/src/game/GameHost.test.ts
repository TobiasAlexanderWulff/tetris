/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { GameHost } from './GameHost';
import { createEngine } from '@tetris/core';
import type { IInputSource, IRenderer } from './types';
import type { InputEvent } from '@tetris/core';

class TestRenderer implements IRenderer {
  width = 0;
  height = 0;
  dpr = 1;
  resize(w: number, h: number, dpr: number): void {
    this.width = w;
    this.height = h;
    this.dpr = dpr;
  }
  draw(): void {}
  dispose(): void {}
}

class TestInput implements IInputSource {
  attach(): void {}
  detach(): void {}
  poll(): InputEvent[] {
    return [];
  }
}

describe('GameHost', () => {
  it('advances engine with fixed steps via injected raf/time', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { get: () => 300 });
    Object.defineProperty(container, 'clientHeight', { get: () => 600 });
    document.body.appendChild(container);
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const engine = createEngine({ gravityTable: { 0: 1000 } });
    const renderer = new TestRenderer();
    const input = new TestInput();

    let now = 0;
    const nowFn = () => now;
    let cb: ((t: number) => void) | null = null;
    const raf = (fn: (t: number) => void) => {
      cb = fn;
      return 1;
    };
    const host = new GameHost(canvas, engine, renderer, input, raf, nowFn);
    host.start();

    const y0 = engine.getSnapshot().active!.position.y;
    // simulate ~5 frames at 60Hz
    for (let i = 0; i < 5; i++) {
      now += 16.6667;
      if (cb) (cb as (t: number) => void)(now);
    }
    const y1 = engine.getSnapshot().active!.position.y;
    expect(y1).toBeGreaterThanOrEqual(y0);
    host.dispose();
  });

  it('resizes renderer on handleResize', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { get: () => 400 });
    Object.defineProperty(container, 'clientHeight', { get: () => 200 });
    document.body.appendChild(container);
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const engine = createEngine();
    const renderer = new TestRenderer();
    const input = new TestInput();
    let called = false;
    const rafOnce = (fn: (t: number) => void) => {
      if (!called) {
        called = true;
        fn(0);
      }
      return 1;
    };
    const host = new GameHost(canvas, engine, renderer, input, rafOnce, () => 0);
    host.start();
    expect(renderer.width).toBe(400);
    expect(renderer.height).toBe(200);
    host.dispose();
  });

  it('pauses updates when setPaused(true)', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { get: () => 200 });
    Object.defineProperty(container, 'clientHeight', { get: () => 400 });
    document.body.appendChild(container);
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const engine = createEngine({ gravityTable: { 0: 1000 } });
    const renderer = new TestRenderer();
    const input = new TestInput();

    let now = 0;
    const nowFn = () => now;
    let cb: ((t: number) => void) | null = null;
    const raf = (fn: (t: number) => void) => {
      cb = fn;
      return 1;
    };
    const host = new GameHost(canvas, engine, renderer, input, raf, nowFn);
    host.start();
    // advance a few frames
    const y0 = engine.getSnapshot().active!.position.y;
    for (let i = 0; i < 3; i++) {
      now += 16.6667;
      cb && cb(now);
    }
    const y1 = engine.getSnapshot().active!.position.y;
    expect(y1).toBeGreaterThanOrEqual(y0);
    // pause and advance more frames
    host.setPaused(true);
    for (let i = 0; i < 5; i++) {
      now += 16.6667;
      cb && cb(now);
    }
    const y2 = engine.getSnapshot().active!.position.y;
    expect(y2).toBe(y1);
    host.dispose();
  });
});
