import type { EngineEvent } from '@tetris/core';
import type { IAudio } from './types';

/**
 * Attach audio reactions to engine events and return an unsubscribe function.
 *
 * Maps core EngineEvents to SFX/music triggers on the provided audio surface.
 * Keeps logic lightweight; ids must exist in the audio manifest to have effect.
 */
export function attachAudioToEngine(
  engine: { subscribe(listener: (e: EngineEvent) => void): () => void },
  audio: IAudio,
): () => void {
  const unsub = engine.subscribe((e) => {
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
        // ignore others by default
        break;
    }
  });
  return unsub;
}

