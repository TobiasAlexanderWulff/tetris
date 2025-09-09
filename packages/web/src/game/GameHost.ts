import { createEngine, type Engine, type InputEvent } from '@tetris/core';
import type { IInputSource, IRenderer } from './types';

/**
 * A scheduling function compatible with requestAnimationFrame for testing.
 */
export type RafLike = (cb: (t: number) => void) => number;

/**
 * GameHost ties together the engine, input, and renderer.
 * It runs a fixed-timestep update loop and renders each animation frame.
 */
export class GameHost {
  private rafHandle: number | null = null;
  private lastTime = 0;
  private acc = 0;
  private readonly TICK = 1000 / 60;
  private paused = false;
  private readonly onResizeBound: () => void;

  /**
   * @param canvas - target canvas element
   * @param engine - core engine instance
   * @param renderer - renderer implementation
   * @param input - input source providing normalized InputEvents
   * @param raf - optional rAF-like scheduler for testing
   * @param now - optional time source in ms for testing
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly engine: Engine,
    private readonly renderer: IRenderer,
    private readonly input: IInputSource,
    private readonly raf: RafLike = (cb) => window.requestAnimationFrame(cb),
    private readonly now: () => number = () => performance.now(),
  ) {
    this.onResizeBound = () => this.handleResize();
  }

  /** Start the game loop and attach listeners. */
  start(): void {
    this.input.attach(window);
    window.addEventListener('resize', this.onResizeBound);
    this.handleResize();
    this.lastTime = this.now();
    this.rafHandle = this.raf(this.tick);
  }

  /** Stop the game loop (can be resumed with start). */
  stop(): void {
    if (this.rafHandle !== null && 'cancelAnimationFrame' in window) {
      cancelAnimationFrame(this.rafHandle);
    }
    this.rafHandle = null;
  }

  /** Pause or resume simulation updates. Render continues while paused. */
  setPaused(p: boolean): void {
    this.paused = p;
  }

  /** Cleanup resources and detach listeners. */
  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResizeBound);
    this.input.detach();
    this.renderer.dispose();
  }

  /** Recompute canvas size and notify renderer. */
  private handleResize(): void {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const { clientWidth: w, clientHeight: h } = this.canvas.parentElement || document.body;
    // CSS size
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    // Backing store
    this.canvas.width = Math.max(1, Math.floor(w * dpr));
    this.canvas.height = Math.max(1, Math.floor(h * dpr));
    this.renderer.resize(w, h, dpr);
  }

  /** Animation frame callback; processes updates and renders. */
  private tick = (): void => {
    const now = this.now();
    let dt = now - this.lastTime;
    this.lastTime = now;
    // Clamp to avoid spiral of death on tab restores
    if (dt > 250) dt = 250;
    this.acc += dt;

    if (!this.paused) {
      // Poll input and enqueue for this tick batch
      const events: InputEvent[] = this.input.poll(now) || [];
      for (const e of events) this.engine.enqueueInput(e);

      // Fixed-step updates
      while (this.acc >= this.TICK) {
        this.engine.update(this.TICK);
        this.acc -= this.TICK;
      }
    }

    // Render
    this.renderer.draw(this.engine.getSnapshot());

    this.rafHandle = this.raf(this.tick);
  };
}

/**
 * Helper to create a default engine instance for the host.
 */
export function createDefaultEngine() {
  return createEngine();
}
