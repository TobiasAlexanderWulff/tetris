import type { InputEvent } from '@tetris/core';
import type { IInputSource } from '../game/types';
import { computeBoardLayout } from '../renderer/layout';

/**
 * Configuration options for MouseInput.
 */
export interface MouseConfig {
  /** Enable or disable mouse input processing. */
  enabled: boolean;
  /** Allow emitting Rotate180 on middle click (mirrors settings.allow180). */
  allow180: boolean;
  /** Optional override for sensitivity in px per cell; if not provided, computed from canvas layout. */
  sensitivityPxPerCell?: number;
  /** Deadzone in pixels before considering horizontal movement (to filter jitter). */
  deadzonePx?: number;
  /** Maximum number of horizontal steps to emit per poll to prevent bursts. */
  maxBurstSteps?: number;
}

/**
 * MouseInput maps mouse-only interactions to normalized InputEvents:
 * - Horizontal movement via pointermove (pixels → cells)
 * - Wheel up/down to Rotate CCW/CW
 * - Middle click for 180° (if allowed)
 * - Left click for HardDrop
 * - Right click press/hold for SoftDrop start/stop
 * - Left+Right chord within a short window for Hold piece
 *
 * This source should be attached to the canvas element. It is independent
 * from KeyboardInput and can be combined using MultiInput.
 */
export class MouseInput implements IInputSource {
  private attached = false;
  private target: HTMLElement | null = null;
  private cfg: Required<Omit<MouseConfig, 'sensitivityPxPerCell'>> & { sensitivityPxPerCell?: number };

  // Pending one-shot events delivered on next poll
  private pending: InputEvent['type'][] = [] as any;

  // Movement tracking
  private lastX: number | null = null;
  private accumDx = 0;

  // Buttons state
  private leftDown = false;
  private rightDown = false;
  private middleDown = false;

  // Soft drop active flag
  private softActive = false;

  // Chord detection
  private chordTimer: number | null = null;
  private chordWindowMs = 60; // small window to detect L+R chord
  private pendingClickAction: 'HardDrop' | 'SoftDropStart' | null = null;

  constructor(config?: Partial<MouseConfig>) {
    this.cfg = {
      enabled: config?.enabled ?? true,
      allow180: config?.allow180 ?? false,
      sensitivityPxPerCell: config?.sensitivityPxPerCell,
      deadzonePx: config?.deadzonePx ?? 3,
      maxBurstSteps: config?.maxBurstSteps ?? 4,
    };
  }

  /** Update runtime configuration for mouse input. */
  updateConfig(patch: Partial<MouseConfig>): void {
    this.cfg = { ...this.cfg, ...patch };
  }

  /** Reset transient state and clear any active soft drop. */
  reset(): void {
    this.pending = [] as any;
    this.lastX = null;
    this.accumDx = 0;
    this.leftDown = false;
    this.rightDown = false;
    this.middleDown = false;
    if (this.softActive) this.queue('SoftDropStop', performance.now());
    this.softActive = false;
    if (this.chordTimer !== null) window.clearTimeout(this.chordTimer);
    this.chordTimer = null;
    this.pendingClickAction = null;
  }

  /** Attach listeners to the canvas element. */
  attach(el: HTMLElement | Window): void {
    if (!(el instanceof HTMLElement)) return; // mouse input expects an element
    if (this.attached) return;
    this.attached = true;
    this.target = el;
    el.addEventListener('pointermove', this.onPointerMove as EventListener, { passive: true });
    // Need non-passive for wheel to prevent page scroll
    el.addEventListener('wheel', this.onWheel as EventListener, { passive: false });
    el.addEventListener('pointerdown', this.onPointerDown as EventListener, { passive: false });
    el.addEventListener('pointerup', this.onPointerUp as EventListener, { passive: false });
    el.addEventListener('pointerleave', this.onPointerLeave as EventListener, { passive: true });
    el.addEventListener('contextmenu', this.onContextMenu as EventListener);
  }

  /** Detach all event listeners. */
  detach(): void {
    if (!this.attached || !this.target) return;
    const el = this.target;
    el.removeEventListener('pointermove', this.onPointerMove as EventListener);
    el.removeEventListener('wheel', this.onWheel as EventListener);
    el.removeEventListener('pointerdown', this.onPointerDown as EventListener);
    el.removeEventListener('pointerup', this.onPointerUp as EventListener);
    el.removeEventListener('pointerleave', this.onPointerLeave as EventListener);
    el.removeEventListener('contextmenu', this.onContextMenu as EventListener);
    this.attached = false;
    this.target = null;
  }

  /** Poll and drain pending events, assigning the provided timestamp. */
  poll(nowMs: number): InputEvent[] {
    if (!this.cfg.enabled) return [];
    const out: InputEvent[] = [];
    while (this.pending.length) {
      const type = this.pending.shift()! as InputEvent['type'];
      if (type === 'Rotate180' && !this.cfg.allow180) continue;
      out.push({ type, at: nowMs } as InputEvent);
    }
    return out;
  }

  // --- Event handlers ---

  private onPointerMove = (ev: PointerEvent): void => {
    if (!this.cfg.enabled || !this.target) return;
    const rect = this.target.getBoundingClientRect();
    const x = ev.clientX;
    const y = ev.clientY;
    // Only react if inside canvas bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
    const cellPx = this.cellWidthPx(rect);
    if (!cellPx) return;
    if (this.lastX == null) {
      this.lastX = x;
      return;
    }
    const dx = x - this.lastX;
    this.lastX = x;
    this.accumDx += dx;
    // Apply deadzone
    if (Math.abs(this.accumDx) < (this.cfg.deadzonePx ?? 0)) return;
    // Translate to steps
    const steps = Math.trunc(this.accumDx / cellPx);
    if (steps === 0) return;
    // Cap burst
    const capped = Math.max(-this.cfg.maxBurstSteps, Math.min(this.cfg.maxBurstSteps, steps));
    const dir: InputEvent['type'] = capped > 0 ? 'MoveRight' : 'MoveLeft';
    for (let i = 0; i < Math.abs(capped); i++) this.queue(dir, performance.now());
    // Keep remainder
    this.accumDx -= steps * cellPx;
  };

  private onWheel = (ev: WheelEvent): void => {
    if (!this.cfg.enabled) return;
    ev.preventDefault();
    const type: InputEvent['type'] = ev.deltaY < 0 ? 'RotateCCW' : 'RotateCW';
    this.queue(type, performance.now());
  };

  private onPointerDown = (ev: PointerEvent): void => {
    if (!this.cfg.enabled) return;
    if (ev.button === 0) {
      // Left
      this.leftDown = true;
      ev.preventDefault();
      this.tryChordOrQueue('HardDrop');
    } else if (ev.button === 2) {
      // Right
      this.rightDown = true;
      ev.preventDefault();
      this.tryChordOrQueue('SoftDropStart');
    } else if (ev.button === 1) {
      // Middle
      this.middleDown = true;
      ev.preventDefault();
      this.queue('Rotate180', performance.now());
    }
  };

  private onPointerUp = (ev: PointerEvent): void => {
    if (!this.cfg.enabled) return;
    if (ev.button === 0) {
      this.leftDown = false;
      // if a chord timer was pending for left, cancel and resolve
      this.resolvePendingSingle('HardDrop');
    } else if (ev.button === 2) {
      this.rightDown = false;
      this.resolvePendingSingle('SoftDropStart');
      if (this.softActive) {
        this.queue('SoftDropStop', performance.now());
        this.softActive = false;
      }
    } else if (ev.button === 1) {
      this.middleDown = false;
    }
  };

  private onPointerLeave = (_ev: PointerEvent): void => {
    // Stop soft drop if pointer leaves canvas while active
    if (this.softActive) {
      this.queue('SoftDropStop', performance.now());
      this.softActive = false;
    }
    this.lastX = null;
    this.accumDx = 0;
  };

  private onContextMenu = (ev: MouseEvent): void => {
    // Block context menu when right click is used for soft drop
    if (this.cfg.enabled) ev.preventDefault();
  };

  // --- Helpers ---

  private cellWidthPx(rect: DOMRect): number | null {
    // 10 columns, 20 rows visible in current engine config
    const layout = computeBoardLayout(rect.width, rect.height, 10, 20, 0);
    return layout.cell || null;
  }

  private queue(type: InputEvent['type'], _at: number): void {
    // At timestamp assigned during poll
    if (type === 'Rotate180' && !this.cfg.allow180) return;
    if (!this.cfg.enabled) return;
    // Handle soft drop state bookkeeping
    if (type === 'SoftDropStart') this.softActive = true;
    this.pending.push(type);
  }

  private tryChordOrQueue(action: 'HardDrop' | 'SoftDropStart'): void {
    // If the other button is already down, emit Hold immediately.
    const otherDown = action === 'HardDrop' ? this.rightDown : this.leftDown;
    if (otherDown) {
      // If soft drop was about to start, cancel its effect
      if (action === 'HardDrop' && this.softActive) {
        this.queue('SoftDropStop', performance.now());
        this.softActive = false;
      }
      this.cancelChordTimer();
      this.pendingClickAction = null;
      this.queue('Hold', performance.now());
      return;
    }

    // Otherwise, start chord window; delay the single action slightly
    this.pendingClickAction = action;
    this.cancelChordTimer();
    this.chordTimer = window.setTimeout(() => {
      if (this.pendingClickAction) {
        this.queue(this.pendingClickAction, performance.now());
        this.pendingClickAction = null;
      }
      this.cancelChordTimer();
    }, this.chordWindowMs);
  }

  private resolvePendingSingle(action: 'HardDrop' | 'SoftDropStart'): void {
    if (this.pendingClickAction === action) {
      // The timer will fire soon; allow it. If we want to flush immediately, uncomment below.
      // this.queue(action, performance.now());
      this.pendingClickAction = null;
      this.cancelChordTimer();
    }
  }

  private cancelChordTimer(): void {
    if (this.chordTimer !== null) {
      window.clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }
  }
}

