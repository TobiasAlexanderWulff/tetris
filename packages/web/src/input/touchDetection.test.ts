import { describe, expect, it } from 'vitest';
import { shouldEnableTouchControls } from './touchDetection';

describe('shouldEnableTouchControls', () => {
  it('enables controls when mode is on regardless of device capabilities', () => {
    expect(shouldEnableTouchControls('on', { coarsePointer: false, viewportWidth: 1440 })).toBe(
      true,
    );
  });

  it('disables controls when mode is off on a touch-sized device', () => {
    expect(shouldEnableTouchControls('off', { coarsePointer: true, viewportWidth: 390 })).toBe(
      false,
    );
  });

  it('enables auto mode only for coarse pointers at tablet-sized widths', () => {
    expect(shouldEnableTouchControls('auto', { coarsePointer: true, viewportWidth: 1024 })).toBe(
      true,
    );
    expect(shouldEnableTouchControls('auto', { coarsePointer: false, viewportWidth: 390 })).toBe(
      false,
    );
    expect(shouldEnableTouchControls('auto', { coarsePointer: true, viewportWidth: 1280 })).toBe(
      false,
    );
  });
});
