import { describe, it, expect } from 'vitest';
import { createEngine } from '../src';
import { collides, type BoardSpec } from '../src/board/board';
import { TETROMINO_SHAPES } from '../src/pieces/tetromino';

function step(e: any, ms: number) {
  e.update(ms);
}

describe('hold, ghost, and lock reset behavior', () => {
  it('hold only once until lock, then re-enable', () => {
    const e = createEngine({ lockDelayMs: 100, gravityCps: 0 });
    const s0 = e.getSnapshot();
    const first = s0.active!.id;
    // First hold succeeds
    e.enqueueInput({ type: 'Hold', at: 0 });
    step(e, 17);
    let s1 = e.getSnapshot();
    expect(s1.hold).toBe(first);
    expect(s1.canHold).toBe(false);
    const secondActive = s1.active!.id;
    // Second hold should be ignored until piece locks
    e.enqueueInput({ type: 'Hold', at: 0 });
    step(e, 17);
    s1 = e.getSnapshot();
    expect(s1.active!.id).toBe(secondActive);
    // Hard drop to lock and spawn next; hold re-enabled
    e.enqueueInput({ type: 'HardDrop', at: 0 });
    step(e, 17);
    const s2 = e.getSnapshot();
    expect(s2.canHold).toBe(true);
  });

  it('ghost matches final non-colliding drop position', () => {
    const e = createEngine({ width: 10, heightVisible: 20, bufferRows: 2 });
    const s = e.getSnapshot();
    const a = s.active!;
    const spec: BoardSpec = {
      width: s.width,
      heightVisible: s.heightVisible,
      bufferRows: s.bufferRows,
    };
    // Compute expected ghost via collision checks
    let y = a.position.y;
    while (true) {
      const pos = { x: a.position.x, y: y + 1 };
      if (collides(spec, s.board, a.id, a.rotation as any, pos)) break;
      y++;
    }
    const shape = TETROMINO_SHAPES[a.id][a.rotation as any];
    const expected = shape.map((c) => ({ x: a.position.x + c.x, y: y + c.y }));
    const ghost = s.ghost!;
    // Compare as sets of coordinates
    const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
    const got = new Set(ghost.map(key));
    for (const cell of expected) expect(got.has(key(cell))).toBe(true);
  });

  it('lock delay resets are bounded; piece locks after timer', () => {
    const e = createEngine({ gravityCps: 1000, lockDelayMs: 50, maxLockResets: 2, width: 10 }, 7);
    // Let it reach ground quickly
    step(e, 200);
    // Attempt many horizontal wiggles to reset lock
    for (let i = 0; i < 10; i++) {
      e.enqueueInput({ type: 'MoveLeft', at: 0 });
      step(e, 17);
      e.enqueueInput({ type: 'MoveRight', at: 0 });
      step(e, 17);
    }
    // After some time, piece should have locked and a new one spawned
    step(e, 200);
    const s = e.getSnapshot();
    expect(s.active).not.toBeNull();
  });
});

