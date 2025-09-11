import type { InputEvent } from '@tetris/core';
import type { IInputSource } from '../game/types';

/**
 * MultiInput composes multiple IInputSource implementations into a single
 * input source. It fans out attach/detach/reset and concatenates events
 * from each child on poll.
 */
export class MultiInput implements IInputSource {
  private readonly children: IInputSource[];
  private attachedTarget: HTMLElement | Window | null = null;

  constructor(children: IInputSource[]) {
    this.children = children;
  }

  /** Attach all child inputs to the provided target. */
  attach(el: HTMLElement | Window): void {
    this.attachedTarget = el;
    for (const c of this.children) c.attach(el);
  }

  /** Detach all child inputs. */
  detach(): void {
    for (const c of this.children) c.detach();
    this.attachedTarget = null;
  }

  /** Poll each child and concatenate their events. */
  poll(nowMs: number): InputEvent[] {
    const out: InputEvent[] = [];
    for (const c of this.children) {
      const evts = c.poll(nowMs) || [];
      if (evts.length) out.push(...evts);
    }
    return out;
  }

  /** Reset all children that support reset. */
  reset(): void {
    for (const c of this.children) c.reset?.();
  }
}

