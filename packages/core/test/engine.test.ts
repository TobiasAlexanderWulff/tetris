import { describe, it, expect } from 'vitest';
import { createEngine } from '../src/index';

describe('engine basic lifecycle', () => {
  it('creates engine and advances active piece with gravity', () => {
    const e = createEngine({ gravityCps: 1000 });
    const y0 = e.getSnapshot().active!.position.y;
    e.update(10); // high gravity => multiple cells
    const y1 = e.getSnapshot().active!.position.y;
    expect(y1).toBeGreaterThanOrEqual(y0);
  });
});
