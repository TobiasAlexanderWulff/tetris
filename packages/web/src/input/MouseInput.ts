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
  private eventTarget: HTMLElement | Window | null = null;
  private boundsEl: HTMLElement | null = null;
  private cfg: Required<Omit<MouseConfig, 'sensitivityPxPerCell'>> & { sensitivityPxPerCell?: number };

  // Pending one-shot events delivered on next poll
  private pending: InputEvent['type'][] = [];

  // Movement tracking
  private lastX: number | null = null;
  private accumDx = 0;
  /**
   * Pending activation threshold in CSS pixels before horizontal movement
   * starts influencing the piece. This is armed by the host (e.g. on piece
   * spawn or rotation) to require moving the mouse by a minimum distance of
   * `cell + pieceWidth/2` cells from the original pointer position.
   */
  private activationPxRemaining = 0;
  /** When true, the next pointer movement will initialize activation threshold. */
  private activationArmed = false;
  /** Cached threshold in cells to compute px on next move (depends on cell size). */
  private activationThresholdCells: number | null = null;
  /** Current active piece width in cells (for edge guard). */
  private pieceWidthCells: number | null = null;
  /** Side from which the pointer was last outside the board ('left'|'right'). */
  private lastOutsideSide: 'left' | 'right' | null = null;
  /** Active edge guard side after re-entry; disabled once threshold is crossed. */
  private guardSide: 'left' | 'right' | null = null;

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
    this.pending = [];
    this.lastX = null;
    this.accumDx = 0;
    this.activationPxRemaining = 0;
    this.activationArmed = false;
    this.activationThresholdCells = null;
    this.lastOutsideSide = null;
    this.guardSide = null;
    this.leftDown = false;
    this.rightDown = false;
    this.middleDown = false;
    if (this.softActive) this.queue('SoftDropStop');
    this.softActive = false;
    if (this.chordTimer !== null) window.clearTimeout(this.chordTimer);
    this.chordTimer = null;
    this.pendingClickAction = null;
  }

  /**
   * Attach listeners. Works with either an HTMLElement (preferred) or Window.
   * When attaching to Window, set a bounds element via setBoundsElement() so
   * movement can be limited to the canvas area.
   */
  attach(el: HTMLElement | Window): void {
    if (this.attached) return;
    this.attached = true;
    this.eventTarget = el;
    // If attaching directly to an element, also use it for bounds by default
    if (el instanceof HTMLElement && !this.boundsEl) this.boundsEl = el;
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
    if (!this.attached || !this.eventTarget) return;
    const el = this.eventTarget as EventTarget & {
      removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
    };
    el.removeEventListener('pointermove', this.onPointerMove as EventListener);
    el.removeEventListener('wheel', this.onWheel as EventListener);
    el.removeEventListener('pointerdown', this.onPointerDown as EventListener);
    el.removeEventListener('pointerup', this.onPointerUp as EventListener);
    el.removeEventListener('pointerleave', this.onPointerLeave as EventListener);
    el.removeEventListener('contextmenu', this.onContextMenu as EventListener);
    this.attached = false;
    this.eventTarget = null;
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
    if (!this.cfg.enabled || !this.boundsEl) return;
    const rect = this.boundsEl.getBoundingClientRect();
    const x = ev.clientX;
    const y = ev.clientY;
    // Only react if inside canvas bounds; if outside, stop soft drop if active
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (this.softActive) {
        this.queue('SoftDropStop');
        this.softActive = false;
      }
      // When pointer leaves the playfield, drop horizontal accumulation and
      // baseline so re-entry doesn't create a huge delta jump.
      this.lastX = null;
      this.accumDx = 0;
      return;
    }
    const layout = computeBoardLayout(rect.width, rect.height, 10, 20, 0);
    const cellPx = layout.cell;
    if (!cellPx) return;
    // Board rect in CSS pixels within the canvas
    const bx1 = rect.left + layout.ox;
    const by1 = rect.top + layout.oy;
    const bx2 = bx1 + layout.bw;
    const by2 = by1 + layout.bh;
    // If pointer is outside board area, remember side (left/right), reset baseline and accum.
    if (x < bx1 || x > bx2 || y < by1 || y > by2) {
      if (this.softActive) {
        this.queue('SoftDropStop');
        this.softActive = false;
      }
      // Track horizontal side if outside there; clear if only vertically outside
      this.lastOutsideSide = x < bx1 ? 'left' : x > bx2 ? 'right' : null;
      this.lastX = null;
      this.accumDx = 0;
      return;
    }
    // If we just re-entered from a side, arm guard for that side only.
    if (!this.guardSide && this.lastOutsideSide) {
      this.guardSide = this.lastOutsideSide;
      this.lastOutsideSide = null;
    }
    // Initialize baseline on first move after (re)arming; compute activation px.
    if (this.lastX == null) {
      this.lastX = x;
      if (this.activationArmed) {
        const cells = this.activationThresholdCells ?? 0;
        this.activationPxRemaining = Math.max(0, cells * cellPx);
        this.activationArmed = false;
        this.accumDx = 0;
      }
      return;
    }
    const dx = x - this.lastX;
    this.lastX = x;
    this.accumDx += dx;
    // Edge guard: block inward movement until crossing edge + half piece width,
    // but never block outward movement (towards the edge).
    if (this.pieceWidthCells && this.guardSide) {
      const halfPx = (this.pieceWidthCells / 2) * cellPx;
      const leftGuard = bx1 + halfPx;
      const rightGuard = bx2 - halfPx;
      const inward = this.guardSide === 'left' ? dx > 0 : dx < 0;
      if (
        inward &&
        ((this.guardSide === 'left' && x <= leftGuard) || (this.guardSide === 'right' && x >= rightGuard))
      ) {
        this.accumDx = 0;
        return;
      }
      // Disable guard once we've crossed the guard line into the board
      if ((this.guardSide === 'left' && x > leftGuard) || (this.guardSide === 'right' && x < rightGuard)) {
        this.guardSide = null;
      }
    }
    // If activation threshold is pending, consume it first, ignoring deadzone.
    if (this.activationPxRemaining > 0) {
      const abs = Math.abs(this.accumDx);
      if (abs < this.activationPxRemaining) return;
      const sign = this.accumDx < 0 ? -1 : 1;
      this.accumDx = sign * (abs - this.activationPxRemaining);
      this.activationPxRemaining = 0;
    }
    // Apply deadzone (after activation was consumed)
    if (Math.abs(this.accumDx) < (this.cfg.deadzonePx ?? 0)) return;
    // Translate to steps
    const steps = Math.trunc(this.accumDx / cellPx);
    if (steps === 0) return;
    // Cap burst
    const capped = Math.max(-this.cfg.maxBurstSteps, Math.min(this.cfg.maxBurstSteps, steps));
    const dir: InputEvent['type'] = capped > 0 ? 'MoveRight' : 'MoveLeft';
    for (let i = 0; i < Math.abs(capped); i++) this.queue(dir);
    // Keep remainder
    this.accumDx -= steps * cellPx;
  };

  private onWheel = (ev: WheelEvent): void => {
    if (!this.cfg.enabled) return;
    ev.preventDefault();
    const type: InputEvent['type'] = ev.deltaY < 0 ? 'RotateCCW' : 'RotateCW';
    this.queue(type);
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
      // If left is already held, treat as chord (emit Hold). Otherwise start soft drop immediately.
      if (this.leftDown) {
        if (this.softActive) {
          this.queue('SoftDropStop');
          this.softActive = false;
        }
        this.cancelChordTimer();
        this.pendingClickAction = null;
        this.queue('Hold');
      } else {
        this.queue('SoftDropStart');
      }
    } else if (ev.button === 1) {
      // Middle
      this.middleDown = true;
      ev.preventDefault();
      this.queue('Rotate180');
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
        this.queue('SoftDropStop');
        this.softActive = false;
      }
    } else if (ev.button === 1) {
      this.middleDown = false;
    }
  };

  private onPointerLeave = (): void => {
    // Stop soft drop if pointer leaves canvas while active
    if (this.softActive) {
      this.queue('SoftDropStop');
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

  private queue(type: InputEvent['type']): void {
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
        this.queue('SoftDropStop');
        this.softActive = false;
      }
      this.cancelChordTimer();
      this.pendingClickAction = null;
      this.queue('Hold');
      return;
    }

    // Otherwise, start chord window; delay the single action slightly
    this.pendingClickAction = action;
    this.cancelChordTimer();
    this.chordTimer = window.setTimeout(() => {
      if (this.pendingClickAction) {
        this.queue(this.pendingClickAction);
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

  /**
   * Provide the element used to compute bounds and cell size (typically the canvas).
   * Call this before the host starts polling, e.g., right after constructing MouseInput.
   */
  setBoundsElement(el: HTMLElement | null): void {
    this.boundsEl = el;
  }

  /**
   * Arm an initial drag threshold to delay horizontal movement until the cursor
   * moved by `1 + pieceWidth/2` cells from the next pointer baseline.
   * The threshold is computed in pixels using the current canvas cell size on
   * the next pointer movement.
   *
   * Example: for a 20px cell and a 3-cell-wide piece, the threshold is
   * 20 * (1 + 3/2) = 50px. Only after moving at least 50px horizontally will
   * the first MoveLeft/MoveRight be emitted.
   *
   * Call this on piece spawn and rotation, and it will use the pointer
   * position at that time as the “origin” (we reset the baseline so the small
   * incidental mouse jitter won’t move the piece).
   */
  armStartDragThresholdForPiece(pieceWidthCells: number): void {
    // For the desired UX, movement should only begin after crossing
    // board edge + half piece width. We implement this via an always-on
    // edge guard and do not add an extra start threshold from baseline.
    this.activationThresholdCells = null;
    this.activationPxRemaining = 0;
    this.activationArmed = false;
    this.pieceWidthCells = Math.max(1, pieceWidthCells);
    // Reset baseline to treat current mouse position as origin on next move
    this.lastX = null;
    this.accumDx = 0;
  }
}
