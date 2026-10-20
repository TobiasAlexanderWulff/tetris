import { describe, it, expect } from 'vitest';
import { createEngine } from '../src/index';

/** One fixed simulation tick in milliseconds. */
const TICK_MS = 1000 / 60;

describe('engine basic lifecycle', () => {
  it('drops the active piece at the configured gravity speed', () => {
    const fast = createEngine({ gravityTable: { 0: 1000 } }, 1);
    const slow = createEngine({ gravityTable: { 0: 1 } }, 1);
    const fastStart = fast.getSnapshot().active!.position.y;
    const slowStart = slow.getSnapshot().active!.position.y;

    fast.update(TICK_MS);
    slow.update(TICK_MS);

    expect(fast.getSnapshot().active!.position.y).toBeGreaterThan(fastStart);
    expect(slow.getSnapshot().active!.position.y).toBe(slowStart);
  });
});
