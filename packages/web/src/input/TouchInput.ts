import type { InputEvent } from '@tetris/core';
import type { IInputSource } from '../game/types';
import { computeBoardLayout } from '../renderer/layout';

const MAX_TAP_DURATION_MS = 300;
const TAP_MOVEMENT_CELL_FRACTION = 0.5;
const MAX_VERTICAL_FLICK_DURATION_MS = 180;
const MIN_VERTICAL_FLICK_CELLS = 2;
const VERTICAL_FLICK_DOMINANCE = 2;

/** Actions exposed by the visible touch-control buttons. */
export type TouchButtonAction = 'Hold' | 'RotateCCW' | 'RotateCW' | 'Rotate180' | 'HardDrop';

/** Runtime configuration for touch input. */
export interface TouchInputConfig {
  enabled: boolean;
  allow180: boolean;
  maxBurstSteps: number;
}

/**
 * Converts one-finger board drags and explicit touch-button presses into
 * normalized engine input events.
 */
export class TouchInput implements IInputSource {
  private config: TouchInputConfig;
  private attachedTarget: HTMLElement | Window | null = null;
  private boundsElement: HTMLElement | null = null;
  private activePointerId: number | null = null;
  private startX = 0;
  private lastX = 0;
  private startY = 0;
  private startTime = 0;
  private accumulatedX = 0;
  private maxDistanceSquared = 0;
  private tapEligible = false;
  private verticalFlickEligible = false;
  private softDropActive = false;
  private pending: InputEvent['type'][] = [];

  /** Create a touch input source with optional runtime overrides. */
  constructor(config?: Partial<TouchInputConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      allow180: config?.allow180 ?? false,
      maxBurstSteps: config?.maxBurstSteps ?? 4,
    };
  }

  /** Update whether touch input and optional 180-degree rotation are enabled. */
  updateConfig(patch: Partial<TouchInputConfig>): void {
    if (patch.enabled === false && this.activePointerId !== null) {
      this.endGesture();
    }
    this.config = { ...this.config, ...patch };
  }

  /** Set the canvas element used to calculate board bounds and cell size. */
  setBoundsElement(element: HTMLElement | null): void {
    this.boundsElement = element;
  }

  /** Attach touch-pointer listeners to an element or the window. */
  attach(element: HTMLElement | Window): void {
    if (this.attachedTarget) return;
    this.attachedTarget = element;
    if (element instanceof HTMLElement && !this.boundsElement) {
      this.boundsElement = element;
    }
    element.addEventListener('pointerdown', this.onPointerDown as EventListener, {
      passive: false,
    });
    element.addEventListener('pointermove', this.onPointerMove as EventListener, {
      passive: false,
    });
    element.addEventListener('pointerup', this.onPointerEnd as EventListener, {
      passive: false,
    });
    element.addEventListener('pointercancel', this.onPointerCancel as EventListener, {
      passive: false,
    });
  }

  /** Detach listeners and terminate an active soft drop. */
  detach(): void {
    if (this.attachedTarget) {
      this.attachedTarget.removeEventListener('pointerdown', this.onPointerDown as EventListener);
      this.attachedTarget.removeEventListener('pointermove', this.onPointerMove as EventListener);
      this.attachedTarget.removeEventListener('pointerup', this.onPointerEnd as EventListener);
      this.attachedTarget.removeEventListener(
        'pointercancel',
        this.onPointerCancel as EventListener,
      );
    }
    this.attachedTarget = null;
    this.endGesture();
  }

  /** Reset queued gesture state while preserving a required soft-drop stop. */
  reset(): void {
    const wasSoftDropping = this.softDropActive;
    this.pending = [];
    this.clearGesture();
    if (wasSoftDropping) this.pending.push('SoftDropStop');
  }

  /** Drain queued events and stamp them with the host-provided time. */
  poll(nowMs: number): InputEvent[] {
    const events = this.pending.map((type) => ({ type, at: nowMs }) as InputEvent);
    this.pending = [];
    return events;
  }

  /** Queue an action originating from a semantic touch-control button. */
  triggerAction(action: TouchButtonAction): void {
    if (!this.config.enabled) return;
    if (action === 'Rotate180' && !this.config.allow180) return;
    this.pending.push(action);
  }

  /** Begin tracking the first touch pointer that starts inside the board. */
  private onPointerDown = (event: PointerEvent): void => {
    if (!this.config.enabled || event.pointerType !== 'touch') {
      return;
    }
    if (this.activePointerId !== null) {
      this.tapEligible = false;
      this.verticalFlickEligible = false;
      return;
    }
    const board = this.boardGeometry();
    if (!board || !isInside(event.clientX, event.clientY, board)) return;
    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.startX = event.clientX;
    this.lastX = event.clientX;
    this.startY = event.clientY;
    this.startTime = event.timeStamp;
    this.accumulatedX = 0;
    this.maxDistanceSquared = 0;
    this.tapEligible = true;
    this.verticalFlickEligible = true;
  };

  /** Convert active touch movement into cell steps and soft-drop activation. */
  private onPointerMove = (event: PointerEvent): void => {
    if (
      !this.config.enabled ||
      event.pointerType !== 'touch' ||
      event.pointerId !== this.activePointerId
    ) {
      return;
    }
    const board = this.boardGeometry();
    if (!board) return;
    event.preventDefault();
    this.trackMovement(event.clientX, event.clientY);

    this.accumulatedX += event.clientX - this.lastX;
    this.lastX = event.clientX;
    const requestedSteps = Math.trunc(this.accumulatedX / board.cell);
    if (requestedSteps !== 0) {
      const emittedSteps = Math.max(
        -this.config.maxBurstSteps,
        Math.min(this.config.maxBurstSteps, requestedSteps),
      );
      const type: InputEvent['type'] = emittedSteps > 0 ? 'MoveRight' : 'MoveLeft';
      for (let index = 0; index < Math.abs(emittedSteps); index += 1) {
        this.pending.push(type);
      }
      this.accumulatedX -= emittedSteps * board.cell;
      this.tapEligible = false;
      this.verticalFlickEligible = false;
    }

    if (!this.softDropActive && event.clientY - this.startY >= board.cell) {
      this.softDropActive = true;
      this.tapEligible = false;
      this.pending.push('SoftDropStart');
    }
  };

  /** Finish an active pointer-up and emit a qualifying board-tap rotation. */
  private onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' || event.pointerId !== this.activePointerId) {
      return;
    }
    event.preventDefault();
    const board = this.boardGeometry();
    let verticalFlickAction: 'HardDrop' | 'Hold' | null = null;
    if (board) {
      this.trackMovement(event.clientX, event.clientY);
      const duration = event.timeStamp - this.startTime;
      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;
      verticalFlickAction = this.classifyVerticalFlick(duration, deltaX, deltaY, board.cell);
      const movementLimit = board.cell * TAP_MOVEMENT_CELL_FRACTION;
      if (
        !verticalFlickAction &&
        this.tapEligible &&
        duration >= 0 &&
        duration <= MAX_TAP_DURATION_MS &&
        this.maxDistanceSquared < movementLimit * movementLimit &&
        isInside(event.clientX, event.clientY, board)
      ) {
        this.pending.push(this.startX < (board.left + board.right) / 2 ? 'RotateCCW' : 'RotateCW');
      }
    }
    this.endGesture();
    if (verticalFlickAction) this.pending.push(verticalFlickAction);
  };

  /** Cancel the active gesture without interpreting it as a tap. */
  private onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' || event.pointerId !== this.activePointerId) {
      return;
    }
    event.preventDefault();
    this.tapEligible = false;
    this.endGesture();
  };

  /** Track the greatest displacement from the gesture origin. */
  private trackMovement(clientX: number, clientY: number): void {
    const deltaX = clientX - this.startX;
    const deltaY = clientY - this.startY;
    this.maxDistanceSquared = Math.max(this.maxDistanceSquared, deltaX * deltaX + deltaY * deltaY);
  }

  /** Classify an eligible fast vertical release as hard drop or hold. */
  private classifyVerticalFlick(
    duration: number,
    deltaX: number,
    deltaY: number,
    cell: number,
  ): 'HardDrop' | 'Hold' | null {
    const verticalDistance = Math.abs(deltaY);
    if (
      !this.verticalFlickEligible ||
      duration < 0 ||
      duration > MAX_VERTICAL_FLICK_DURATION_MS ||
      verticalDistance < cell * MIN_VERTICAL_FLICK_CELLS ||
      verticalDistance < Math.abs(deltaX) * VERTICAL_FLICK_DOMINANCE
    ) {
      return null;
    }
    return deltaY > 0 ? 'HardDrop' : 'Hold';
  }

  /** Compute the current board rectangle from the live canvas dimensions. */
  private boardGeometry(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    cell: number;
  } | null {
    if (!this.boundsElement) return null;
    const rect = this.boundsElement.getBoundingClientRect();
    const layout = computeBoardLayout(rect.width, rect.height, 10, 20, 0);
    const left = rect.left + layout.ox;
    const top = rect.top + layout.oy;
    return {
      left,
      top,
      right: left + layout.bw,
      bottom: top + layout.bh,
      cell: layout.cell,
    };
  }

  /** Queue a soft-drop stop when necessary and clear gesture state. */
  private endGesture(): void {
    if (this.softDropActive) this.pending.push('SoftDropStop');
    this.clearGesture();
  }

  /** Clear active pointer bookkeeping without changing queued events. */
  private clearGesture(): void {
    this.activePointerId = null;
    this.accumulatedX = 0;
    this.maxDistanceSquared = 0;
    this.tapEligible = false;
    this.verticalFlickEligible = false;
    this.softDropActive = false;
  }
}

/** Return whether a client coordinate lies inside the supplied rectangle. */
function isInside(
  x: number,
  y: number,
  bounds: { left: number; top: number; right: number; bottom: number },
): boolean {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}
