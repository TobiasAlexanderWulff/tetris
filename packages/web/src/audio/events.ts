import type { EngineEvent } from '@tetris/core';
import type { IAudio } from './types';

/**
 * Create a handler that maps EngineEvents to audio calls.
 * Use this to fan-out a single engine subscription to multiple consumers
 * to avoid draining events multiple times.
 */
export function audioEventHandler(audio: IAudio) {
  return (e: EngineEvent): void => {
    switch (e.type) {
      case 'PieceRotated':
        audio.playSfx('rotate');
        break;
      case 'HardDropped':
        audio.playSfx('hard_drop');
        break;
      case 'Locked':
        audio.playSfx('lock');
        break;
      case 'LinesCleared': {
        audio.playSfx('line_clear');
        if (e.count === 4 || e.b2b) audio.playSfx('tetris');
        break;
      }
      case 'LevelChanged':
        audio.playSfx('level_up');
        break;
      case 'GameOver':
        audio.playSfx('game_over');
        break;
      default:
        break;
    }
  };
}

/**
 * Deprecated: direct subscription drains engine events multiple times if used alongside
 * other subscribers. Prefer `audioEventHandler(audio)` + a single engine.subscribe in UI.
 */
export function attachAudioToEngine(
  engine: { subscribe(listener: (e: EngineEvent) => void): () => void },
  audio: IAudio,
): () => void {
  const handler = audioEventHandler(audio);
  return engine.subscribe(handler);
}
