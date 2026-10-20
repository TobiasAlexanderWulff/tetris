import { describe, it, expect } from 'vitest';
import { createEngine, type Engine, type EngineEvent } from '../src';

/** A `LinesCleared` engine event, used to assert back-to-back reporting. */
type LinesClearedEvent = Extract<EngineEvent, { type: 'LinesCleared' }>;

/**
 * Advances the engine until an I piece is active.
 *
 * Non-I pieces are hard-dropped after clearing the board so they cannot
 * interfere with the upcoming four-row setup.
 */
function waitForIPiece(engine: Engine): void {
  for (let attempts = 0; attempts < 14; attempts++) {
    const snapshot = engine.getSnapshot();
    if (snapshot.active?.id === 'I') return;
    snapshot.board.fill(0);
    engine.enqueueInput({ type: 'HardDrop', at: 0 });
    engine.update(17);
  }
  throw new Error('Could not find an I piece within the first two bags');
}

/**
 * Clears the board and fills the bottom four rows except for column 0,
 * leaving a vertical gap that a rotated I piece can fill.
 */
function prepareTetrisGap(engine: Engine): void {
  const snapshot = engine.getSnapshot();
  snapshot.board.fill(0);
  const totalRows = snapshot.heightVisible + snapshot.bufferRows;
  for (let y = totalRows - 4; y < totalRows; y++) {
    for (let x = 1; x < snapshot.width; x++) {
      snapshot.board[y * snapshot.width + x] = 1;
    }
  }
}

/** Rotates the active I piece into the column-0 gap and hard-drops it. */
function dropIInGap(engine: Engine): void {
  engine.enqueueInput({ type: 'RotateCW', at: 0 });
  engine.enqueueInput({ type: 'MoveLeft', at: 0 });
  engine.enqueueInput({ type: 'MoveLeft', at: 0 });
  engine.enqueueInput({ type: 'HardDrop', at: 0 });
  engine.update(17);
}

/**
 * Collects `LinesCleared` events until the returned unsubscribe function is
 * called. The engine drains events on a zero-delay timer, hence the async wait
 * in the test below.
 */
function collectLineClears(engine: Engine): {
  events: LinesClearedEvent[];
  unsubscribe: () => void;
} {
  const events: LinesClearedEvent[] = [];
  const unsubscribe = engine.subscribe((event) => {
    if (event.type === 'LinesCleared') events.push(event);
  });
  return { events, unsubscribe };
}

describe('back-to-back event reporting', () => {
  it('only flags a Tetris as B2B when it follows another Tetris', async () => {
    const engine = createEngine({ gravityTable: { 0: 0 } }, 7);
    const { events, unsubscribe } = collectLineClears(engine);

    try {
      waitForIPiece(engine);
      prepareTetrisGap(engine);
      dropIInGap(engine);

      waitForIPiece(engine);
      prepareTetrisGap(engine);
      dropIInGap(engine);

      // Let the engine's event pump drain the queued events.
      await new Promise((resolve) => setTimeout(resolve, 25));
    } finally {
      unsubscribe();
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ count: 4, b2b: false });
    expect(events[1]).toMatchObject({ count: 4, b2b: true });
  });
});
