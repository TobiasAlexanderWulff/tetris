import type { TetrominoId } from '../types';
import { XorShift32 } from './prng';

/**
 * 7-bag randomizer. Refills by shuffling the 7 tetrominoes uniformly.
 */
export class BagRandomizer {
  private readonly rng: XorShift32;
  private bag: TetrominoId[] = [];

  constructor(seed: number) {
    this.rng = new XorShift32(seed);
  }

  /** Draws the next tetromino id, refilling the bag if needed. */
  next(): TetrominoId {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  /** Returns the next k ids without consuming them (refills as needed). */
  peek(k: number): TetrominoId[] {
    while (this.bag.length < k) this.refill();
    // last items are next to draw
    return this.bag.slice(this.bag.length - k).reverse();
  }

  private refill(): void {
    const ids: TetrominoId[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    // Fisher–Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.nextFloat() * (i + 1));
      const ai = ids[i]!;
      const aj = ids[j]!;
      ids[i] = aj;
      ids[j] = ai;
    }
    // push to stack so pop() returns next; iterate to avoid type quirks
    for (let i = ids.length - 1; i >= 0; i--) this.bag.push(ids[i]!);
  }
}
