import type { InputEvent, Snapshot } from '@tetris/core';

/**
 * Interface for a renderer that can resize and draw snapshots.
 */
export interface IRenderer {
  /** Resize the renderer backing store and adjust transforms for DPR. */
  resize(width: number, height: number, dpr: number): void;
  /** Draw a full frame from the engine snapshot. */
  draw(snapshot: Snapshot): void;
  /** Release any resources. */
  dispose(): void;
}

/**
 * Interface for an input source that can be attached to an element
 * and polled for normalized InputEvents.
 */
export interface IInputSource {
  attach(el: HTMLElement | Window): void;
  detach(): void;
  /**
   * Poll any queued inputs to deliver for the next update tick.
   * The `nowMs` value is provided for timing-based sources.
   */
  poll(nowMs: number): InputEvent[];
}

