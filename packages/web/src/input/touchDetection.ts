import type { TouchControlsMode } from '../state/settings';

/** Maximum viewport width treated as a mobile or tablet layout in auto mode. */
export const TOUCH_AUTO_MAX_WIDTH = 1024;

/**
 * Device signals used to decide whether automatic touch controls are active.
 */
export interface TouchEnvironment {
  coarsePointer: boolean;
  viewportWidth: number;
}

/**
 * Resolve the effective touch-control state from a setting and device signals.
 */
export function shouldEnableTouchControls(
  mode: TouchControlsMode,
  environment: TouchEnvironment,
): boolean {
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  return environment.coarsePointer && environment.viewportWidth <= TOUCH_AUTO_MAX_WIDTH;
}

/**
 * Read the current browser signals used by touch-control auto detection.
 */
export function detectTouchEnvironment(): TouchEnvironment {
  if (typeof window === 'undefined') {
    return { coarsePointer: false, viewportWidth: Number.POSITIVE_INFINITY };
  }
  return {
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    viewportWidth: window.innerWidth,
  };
}
