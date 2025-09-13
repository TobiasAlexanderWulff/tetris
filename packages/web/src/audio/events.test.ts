import { describe, it, expect } from 'vitest';
import type { EngineEvent } from '@tetris/core';
import type { IAudio } from './types';
import { attachAudioToEngine } from './events';

class FakeEngine {
  listener: ((e: EngineEvent) => void) | null = null;
  subscribe(fn: (e: EngineEvent) => void): () => void {
    this.listener = fn;
    return () => {
      this.listener = null;
    };
  }
  emit(e: EngineEvent): void {
    this.listener?.(e);
  }
}

class FakeAudio implements IAudio {
  calls: Array<{ m: string; id?: string }> = [];
  async preload(): Promise<void> {/* no-op */}
  async resumeOnUserGesture(): Promise<void> {/* no-op */}
  playSfx(id: string): void { this.calls.push({ m: 'sfx', id }); }
  playMusic(): void { this.calls.push({ m: 'music' }); }
  stopMusic(): void { this.calls.push({ m: 'stop' }); }
  crossfade(): void { this.calls.push({ m: 'xfade' }); }
  setVolume(): void {/* no-op */}
  muteAll(): void {/* no-op */}
}

describe('attachAudioToEngine', () => {
  it('maps engine events to SFX and unsubscribes cleanly', () => {
    const eng = new FakeEngine();
    const audio = new FakeAudio();
    const off = attachAudioToEngine(eng as unknown as { subscribe: (fn: (e: EngineEvent) => void) => () => void }, audio);

    eng.emit({ type: 'PieceRotated' });
    eng.emit({ type: 'HardDropped' });
    eng.emit({ type: 'Locked' });
    eng.emit({ type: 'LinesCleared', count: 1, rows: [0], b2b: false, combo: 0 });
    eng.emit({ type: 'LinesCleared', count: 4, rows: [0,1,2,3], b2b: true, combo: 2 });
    eng.emit({ type: 'LevelChanged', level: 2 });
    eng.emit({ type: 'GameOver' });

    const ids = audio.calls.filter(c => c.m === 'sfx').map(c => c.id);
    expect(ids).toEqual([
      'rotate',
      'hard_drop',
      'lock',
      'line_clear',
      'line_clear',
      'tetris',
      'level_up',
      'game_over',
    ]);

    // Unsubscribe and ensure no further calls are recorded
    off();
    eng.emit({ type: 'PieceRotated' });
    const idsAfter = audio.calls.filter(c => c.m === 'sfx').map(c => c.id);
    expect(idsAfter).toEqual(ids);
  });
});

