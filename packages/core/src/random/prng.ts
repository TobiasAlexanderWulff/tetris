/**
 * XorShift32 PRNG for deterministic, fast random numbers.
 * State and outputs are 32-bit; returns floats in [0, 1).
 */
export class XorShift32 {
  private state: number;

  /** Create a PRNG with a non-zero seed. */
  constructor(seed: number) {
    let s = seed | 0;
    if (s === 0) s = 0x9e3779b9; // golden ratio constant if zero provided
    this.state = s;
  }

  /** Returns a uint32 value. */
  nextU32(): number {
    // xorshift32
    let x = this.state | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x | 0;
    return (x >>> 0) as number;
  }

  /** Returns a float in [0, 1). */
  nextFloat(): number {
    // Divide by 2^32
    return this.nextU32() / 0x1_0000_0000;
  }
}
