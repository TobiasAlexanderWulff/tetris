import { describe, expect, it } from 'vitest';
import { createEngine, type Engine, type InputEvent } from '../src';

/**
 * Fills the top spawn rows (except column 0) so the next piece cannot spawn,
 * then hard-drops the current piece to trigger the spawn collision.
 *
 * A fully filled board would be cleared when the piece locks, which would
 * silently prevent the game over.
 */
function reachGameOver(): Engine {
  const engine = createEngine({ gravityTable: { 0: 0 } }, 3);
  const snapshot = engine.getSnapshot();
  const rows = Math.min(3, snapshot.heightVisible + snapshot.bufferRows);
  for (let y = 0; y < rows; y++) {
    for (let x = 1; x < snapshot.width; x++) {
      snapshot.board[y * snapshot.width + x] = 1;
    }
  }
  engine.enqueueInput({ type: 'HardDrop', at: 0 });
  engine.update(17);
  return engine;
}

describe('input handling after game over', () => {
  it('reaches game over with no active piece', () => {
    const engine = reachGameOver();
    expect(engine.getSnapshot().active).toBeNull();
  });

  it('ignores every input type without throwing', () => {
    const engine = reachGameOver();
    const inputs: InputEvent[] = [
      { type: 'MoveLeft', at: 0 },
      { type: 'MoveRight', at: 0 },
      { type: 'RotateCW', at: 0 },
      { type: 'RotateCCW', at: 0 },
      { type: 'Rotate180', at: 0 },
      { type: 'SoftDropStart', at: 0 },
      { type: 'SoftDropStop', at: 0 },
      { type: 'HardDrop', at: 0 },
      { type: 'Hold', at: 0 },
    ];
    for (const input of inputs) engine.enqueueInput(input);

    expect(() => engine.update(1_000)).not.toThrow();
    expect(engine.getSnapshot().active).toBeNull();
  });

  it('keeps updating safely while no piece is active', () => {
    const engine = reachGameOver();
    // Simulates a host that keeps ticking after game over (e.g. Escape resumes
    // the loop before the UI is aware of the game-over state).
    for (let i = 0; i < 60; i++) engine.update(16.67);
    expect(engine.getSnapshot().active).toBeNull();
  });
});
