import { describe, it, expect } from 'vitest';
import { createEngineState, tick } from '../src/index';

describe('core engine scaffold', () => {
  it('increments frame on tick', () => {
    const s0 = createEngineState();
    const s1 = tick(s0);
    expect(s1.frame).toBe(1);
  });
});

