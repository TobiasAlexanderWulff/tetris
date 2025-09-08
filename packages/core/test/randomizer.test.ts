import { describe, it, expect } from 'vitest';
import { BagRandomizer } from '../src/random/bag';

describe('7-bag randomizer', () => {
  it('yields all 7 pieces before repeating', () => {
    const bag = new BagRandomizer(42);
    const seen = new Set<string>();
    for (let i = 0; i < 7; i++) seen.add(bag.next());
    expect(seen.size).toBe(7);
  });

  it('peek returns next pieces without consuming', () => {
    const bag = new BagRandomizer(1);
    const first = bag.peek(3);
    const next = [bag.next(), bag.next(), bag.next()];
    expect(next).toEqual(first);
  });
});

