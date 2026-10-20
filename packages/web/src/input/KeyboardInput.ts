import type { InputEvent } from '@tetris/core';
import type { IInputSource } from '../game/types';
import type { InputConfig, PendingEvent } from './types';
import { DEFAULT_INPUT } from './types';

/**
 * Smallest ARR the repeat loop accepts, in milliseconds. Values at or below
 * zero are clamped to this so the repeat loop always terminates.
 */
const MIN_ARR_MS = 1;

/**
 * Maximum number of horizontal moves emitted by a single poll. This keeps a
 * poll finite even when many repeats are due (for example after the tab was
 * throttled), preventing input bursts.
 */
const MAX_REPEATS_PER_POLL = 8;

/**
 * KeyboardInput implements an input source with DAS/ARR repeat logic
 * for Left/Right movement and simple one-shot events for rotations,
 * hard drop, and hold. Soft drop is emitted as start/stop.
 */
export class KeyboardInput implements IInputSource {
  private cfg: InputConfig;
  private attached = false;
  private target: HTMLElement | Window | null = null;

  // One-shot pending events to deliver on next poll
  private pending: PendingEvent[] = [];

  // Pressed states
  private leftPressed = false;
  private rightPressed = false;
  private softDropPressed = false;
  private activeHorizontal: 'Left' | 'Right' | null = null;
  private leftDownAt = 0;
  private rightDownAt = 0;
  private lastRepeatAt = 0; // last time we emitted a repeat for active direction
  private leftStampPending = false;
  private rightStampPending = false;
  private lastPollNow = 0;

  // Map code->action for quick lookup
  private readonly codeMap = new Map<string, string>();

  constructor(config?: Partial<InputConfig>) {
    this.cfg = {
      ...DEFAULT_INPUT,
      ...config,
      bindings: config?.bindings ?? DEFAULT_INPUT.bindings,
    };
    for (const b of this.cfg.bindings) this.codeMap.set(b.code, b.action);
  }

  /** Update input configuration (DAS/ARR/bindings/allow180) at runtime. */
  updateConfig(patch: Partial<InputConfig>): void {
    const next: InputConfig = {
      ...this.cfg,
      ...patch,
      bindings: patch.bindings ?? this.cfg.bindings,
    };
    // Update fields
    this.cfg = next;
    this.codeMap.clear();
    for (const b of next.bindings) this.codeMap.set(b.code, b.action);
  }

  /** Reset pending inputs and pressed states (used when pausing). */
  reset(): void {
    // If soft drop was held, tell the engine to stop it. Otherwise releasing
    // the key while paused (listeners are detached) would leave soft drop on.
    const wasSoftDropping = this.softDropPressed;
    this.pending = [];
    this.leftPressed = false;
    this.rightPressed = false;
    this.softDropPressed = false;
    this.activeHorizontal = null;
    this.leftDownAt = 0;
    this.rightDownAt = 0;
    this.lastRepeatAt = 0;
    this.leftStampPending = false;
    this.rightStampPending = false;
    this.lastPollNow = 0;
    if (wasSoftDropping) this.pending.push('SoftDropStop');
  }

  /** Attach listeners to the DOM element or window. */
  attach(el: HTMLElement | Window): void {
    if (this.attached) return;
    this.attached = true;
    this.target = el;
    el.addEventListener('keydown', this.onKeyDown as EventListener, { passive: false });
    el.addEventListener('keyup', this.onKeyUp as EventListener, { passive: false });
  }

  /** Detach listeners. */
  detach(): void {
    if (!this.attached || !this.target) return;
    this.target.removeEventListener('keydown', this.onKeyDown as EventListener);
    this.target.removeEventListener('keyup', this.onKeyUp as EventListener);
    this.attached = false;
    this.target = null;
  }

  /**
   * Poll returns any pending one-shot events and DAS/ARR generated repeats
   * based on nowMs. All emitted InputEvents will use nowMs as `at`.
   */
  poll(nowMs: number): InputEvent[] {
    this.lastPollNow = nowMs;
    const out: InputEvent[] = [];

    // Resolve pending timestamps for newly pressed keys to the poll's now
    if (this.leftStampPending) {
      this.leftDownAt = nowMs;
      if (this.activeHorizontal === 'Left') this.lastRepeatAt = nowMs;
      this.leftStampPending = false;
    }
    if (this.rightStampPending) {
      this.rightDownAt = nowMs;
      if (this.activeHorizontal === 'Right') this.lastRepeatAt = nowMs;
      this.rightStampPending = false;
    }

    // Drain pending one-shot events
    while (this.pending.length) {
      const type = this.pending.shift()!;
      if (type === 'Rotate180' && !this.cfg.allow180) continue;
      out.push({ type, at: nowMs } as InputEvent);
    }

    // DAS/ARR for active horizontal
    if (this.activeHorizontal) {
      const pressed = this.activeHorizontal === 'Left' ? this.leftPressed : this.rightPressed;
      const pressedAt = this.activeHorizontal === 'Left' ? this.leftDownAt : this.rightDownAt;
      if (pressed) {
        const das = Number.isFinite(this.cfg.DAS) ? Math.max(0, this.cfg.DAS) : DEFAULT_INPUT.DAS;
        const arr =
          Number.isFinite(this.cfg.ARR) && this.cfg.ARR >= MIN_ARR_MS ? this.cfg.ARR : MIN_ARR_MS;
        // After DAS, emit repeats every ARR ms
        const sinceDown = nowMs - pressedAt;
        if (sinceDown >= das) {
          // Compute number of repeats that should have happened since lastRepeatAt
          let nextAt = Math.max(this.lastRepeatAt, pressedAt + das);
          let emitted = 0;
          while (nextAt + arr <= nowMs + 0.0001 && emitted < MAX_REPEATS_PER_POLL) {
            nextAt += arr;
            emitted++;
            out.push({
              type: this.activeHorizontal === 'Left' ? 'MoveLeft' : 'MoveRight',
              at: nowMs,
            } as InputEvent);
          }
          // If we hit the cap, resync to now so the backlog is dropped instead
          // of producing another burst on the next poll.
          if (emitted >= MAX_REPEATS_PER_POLL) nextAt = Math.max(nextAt, nowMs);
          this.lastRepeatAt = nextAt;
        }
      }
    }

    return out;
  }

  private onKeyDown = (ev: KeyboardEvent): void => {
    const action = this.codeMap.get(ev.code);
    if (!action) return;
    // Prevent scrolling and native repeat behavior from affecting feel
    ev.preventDefault();
    if (ev.repeat) return; // ignore browser repeats; we handle ourselves

    switch (action) {
      case 'Left': {
        this.leftPressed = true;
        this.leftStampPending = true;
        this.activeHorizontal = 'Left';
        this.lastRepeatAt = this.lastPollNow; // will be corrected on next poll
        this.pending.push('MoveLeft'); // initial move
        break;
      }
      case 'Right': {
        this.rightPressed = true;
        this.rightStampPending = true;
        this.activeHorizontal = 'Right';
        this.lastRepeatAt = this.lastPollNow;
        this.pending.push('MoveRight');
        break;
      }
      case 'RotateCW':
        this.pending.push('RotateCW');
        break;
      case 'RotateCCW':
        this.pending.push('RotateCCW');
        break;
      case 'Rotate180':
        this.pending.push('Rotate180');
        break;
      case 'SoftDrop':
        if (!this.softDropPressed) {
          this.softDropPressed = true;
          this.pending.push('SoftDropStart');
        }
        break;
      case 'HardDrop':
        this.pending.push('HardDrop');
        break;
      case 'Hold':
        this.pending.push('Hold');
        break;
      case 'Pause':
        // Pause is managed by UI/host; not emitted to engine
        break;
    }
  };

  private onKeyUp = (ev: KeyboardEvent): void => {
    const action = this.codeMap.get(ev.code);
    if (!action) return;
    ev.preventDefault();
    switch (action) {
      case 'Left':
        this.leftPressed = false;
        if (this.activeHorizontal === 'Left')
          this.activeHorizontal = this.rightPressed ? 'Right' : null;
        this.lastRepeatAt = 0;
        break;
      case 'Right':
        this.rightPressed = false;
        if (this.activeHorizontal === 'Right')
          this.activeHorizontal = this.leftPressed ? 'Left' : null;
        this.lastRepeatAt = 0;
        break;
      case 'SoftDrop':
        if (this.softDropPressed) {
          this.softDropPressed = false;
          this.pending.push('SoftDropStop');
        }
        break;
      default:
        break;
    }
  };
}
