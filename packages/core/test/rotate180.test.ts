import { describe, it, expect } from 'vitest';
import { createEngine } from '../src';

describe('180° rotation', () => {
  it('rotates active piece by 180 when allowed', () => {
    const e = createEngine({ allow180: true, gravityTable: { 0: 0.0 } }, 7);
    // Advance pieces until we get one where 180° affects orientation (J, L, or T)
    let tries = 0;
    while (tries < 14) {
      const s = e.getSnapshot();
      const id = s.active!.id;
      if (id === 'J' || id === 'L' || id === 'T') {
        const before = s.active!;
        e.enqueueInput({ type: 'Rotate180', at: 0 });
        e.update(17);
        const after = e.getSnapshot().active!;
        expect(after.rotation).toBe(((before.rotation + 2) % 4) as 0 | 1 | 2 | 3);
        return;
      }
      // Hard drop to spawn next
      e.enqueueInput({ type: 'HardDrop', at: 0 });
      e.update(17);
      tries++;
    }
    // If we didn't find a suitable piece, fail the test
    throw new Error('Could not find a J/L/T piece within expected draws');
  });
});
