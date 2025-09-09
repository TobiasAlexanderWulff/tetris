import { createEngine, type Engine, type InputEvent, type EngineConfig } from '@tetris/core';
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
  private readonly attachTarget: Window;
  // Cached canvas size and DPR to avoid redundant resize work.
  private lastCssWidth = 0;
  private lastCssHeight = 0;
  private lastDpr = 0;

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
    this.attachTarget = window;
  }

  /** Start the game loop and attach listeners. */
  start(): void {
    this.input.attach(this.attachTarget);
    window.addEventListener('resize', this.onResizeBound);
    // Initial sizing
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
    if (p) {
      // Drop accumulated time and reset input repeats
      this.acc = 0;
      this.input.reset?.();
      this.input.detach();
      // Clear any unprocessed inputs inside the engine
      // Cast to allow optional method presence without coupling to core type in web
      (this.engine as unknown as { clearPendingInputs?: () => void }).clearPendingInputs?.();
    } else {
      // On resume, make sure we don't process a large dt chunk
      this.input.reset?.();
      this.input.attach(this.attachTarget);
      this.lastTime = this.now();
    }
  }

  /** Cleanup resources and detach listeners. */
  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResizeBound);
    this.input.detach();
    this.renderer.dispose();
  }

  /** Recompute canvas size (CSS pixels) and notify renderer; updates backing store for DPR. */
  private handleResize(): void {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    let w = Math.floor(rect.width);
    let h = Math.floor(rect.height);
    if (!w || !h) {
      const parent = (this.canvas.parentElement as HTMLElement) || document.documentElement;
      w = parent.clientWidth;
      h = parent.clientHeight;
    }
    if (w <= 0 || h <= 0) return;
    // Only apply when something changed (rAF-throttled via tick as well)
    if (w !== this.lastCssWidth || h !== this.lastCssHeight || dpr !== this.lastDpr) {
      this.lastCssWidth = w;
      this.lastCssHeight = h;
      this.lastDpr = dpr;
      // Backing store in device pixels; setting these resets the transform
      const bw = Math.max(1, Math.floor(w * dpr));
      const bh = Math.max(1, Math.floor(h * dpr));
      if (this.canvas.width !== bw) this.canvas.width = bw;
      if (this.canvas.height !== bh) this.canvas.height = bh;
      this.renderer.resize(w, h, dpr);
    }
  }

  /** Animation frame callback; processes updates and renders. */
  private tick = (): void => {
    const now = this.now();
    let dt = now - this.lastTime;
    // Clamp to avoid spiral of death on tab restores
    if (dt > 250) dt = 250;

    if (this.paused) {
      // While paused: do not accumulate time or process inputs/updates; keep lastTime in sync
      this.lastTime = now;
    } else {
      this.lastTime = now;
      this.acc += dt;
      // Poll input and enqueue for this tick batch
      const events: InputEvent[] = this.input.poll(now) || [];
      // Filter out 180° rotation for pieces where it should be ignored (I, O, S, Z)
      const activeId = this.engine.getSnapshot().active?.id;
      for (const e of events) {
        if (
          e.type === 'Rotate180' &&
          (activeId === 'I' || activeId === 'O' || activeId === 'S' || activeId === 'Z')
        ) {
          continue;
        }
        this.engine.enqueueInput(e);
      }

      // Fixed-step updates
      while (this.acc >= this.TICK) {
        this.engine.update(this.TICK);
        this.acc -= this.TICK;
      }
    }

    // Throttle resize work to rAF: check for size/DPR changes once per frame
    this.handleResize();
    // Render
    this.renderer.draw(this.engine.getSnapshot());

    this.rafHandle = this.raf(this.tick);
  };
}

/**
 * Helper to create a default engine instance for the host.
 */
export function createDefaultEngine(config?: Partial<EngineConfig>, seed?: number) {
  return createEngine(config, seed);
}
