import { describe, it, expect } from 'vitest';
import { createEngine, type Engine } from '../src';

function step(engine: Engine, ms: number) {
  engine.update(ms);
}

describe('engine movement, rotation, gravity, lock', () => {
  it('spawns a piece and moves left/right within bounds', () => {
    const e = createEngine({ width: 10, heightVisible: 20, bufferRows: 2 }, 123);
    let snap = e.getSnapshot();
    expect(snap.active).not.toBeNull();
    const startX = snap.active!.position.x;
    e.enqueueInput({ type: 'MoveLeft', at: 0 });
    step(e, 17);
    snap = e.getSnapshot();
    expect(snap.active!.position.x).toBe(startX - 1);
    e.enqueueInput({ type: 'MoveRight', at: 0 });
    step(e, 17);
    snap = e.getSnapshot();
    expect(snap.active!.position.x).toBe(startX);
  });

  it('rotates with SRS kicks (no collision)', () => {
    const e = createEngine({}, 7);
    let snap = e.getSnapshot();
    // place the piece one row down to avoid top boundary edge cases
    e.enqueueInput({ type: 'RotateCW', at: 0 });
    step(e, 17);
    snap = e.getSnapshot();
    expect(snap.active!.rotation).toBe(1);
  });

  it('gravity drops and locks the piece over time', () => {
    const e = createEngine({ gravityTable: { 0: 1000 }, lockDelayMs: 100, width: 10 }, 99);
    expect(e.getSnapshot().board.every((cell) => cell === 0)).toBe(true);

    // The piece reaches the floor quickly and the lock delay elapses.
    step(e, 200);

    // A locked piece leaves blocks behind and a new piece spawns.
    const snap = e.getSnapshot();
    expect(snap.board.some((cell) => cell !== 0)).toBe(true);
    expect(snap.active).not.toBeNull();
  });
});
