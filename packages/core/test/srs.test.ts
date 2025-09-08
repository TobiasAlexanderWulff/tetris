import { describe, it, expect } from 'vitest';
import { getKickTable, applyRotation } from '../src/rotations/srs';

describe('SRS', () => {
  it('applyRotation wraps correctly', () => {
    expect(applyRotation(0, -1)).toBe(3);
    expect(applyRotation(3, 1)).toBe(0);
    expect(applyRotation(2, 2)).toBe(0);
  });

  it('I piece uses I kick table', () => {
    const t = getKickTable('I');
    expect(t['0-1'][0]).toEqual({ x: 0, y: 0 });
  });
});

