import { describe, it, expect, beforeEach } from 'vitest';
import type { AudioManifest, IAudioAdapter } from './types';
import { AudioService } from './AudioService';

class FakeAdapter implements IAudioAdapter {
  calls: Array<{ m: string; args: unknown[] }> = [];
  vols: Record<string, number> = { master: 0.8, music: 0.6, sfx: 0.9 };
  muted = false;
  async preload(_manifest: AudioManifest): Promise<void> {
    // mark as used to satisfy lint
    void _manifest;
  }
  async resume(): Promise<void> {
    /* no-op */
  }
  playSfx(id: string, opts: { detuneCents?: number; gain?: number }): void {
    this.calls.push({ m: 'playSfx', args: [id, opts] });
  }
  startMusic(id: string, opts: { loop?: boolean; startAt?: number }): void {
    this.calls.push({ m: 'startMusic', args: [id, opts] });
  }
  stopMusic(opts: { fadeSec?: number }): void {
    this.calls.push({ m: 'stopMusic', args: [opts] });
  }
  crossfade(toId: string, seconds: number): void {
    this.calls.push({ m: 'crossfade', args: [toId, seconds] });
  }
  setBusVolume(kind: 'master' | 'music' | 'sfx', value: number): void {
    this.vols[kind] = value;
    this.calls.push({ m: 'setBusVolume', args: [kind, value] });
  }
  setMuted(flag: boolean): void {
    this.muted = flag;
    this.calls.push({ m: 'setMuted', args: [flag] });
  }
}

function manifest(): AudioManifest {
  return {
    sfx: {
      rotate_cw: { url: '/sfx/rotate_cw.ogg', gain: 0.8, maxPoly: 1 },
      line_clear: { url: '/sfx/line_clear.ogg', gain: 1.0, maxPoly: 8 },
    },
    music: {
      theme_main: { url: '/music/theme.ogg', gain: 0.7, loopStart: 2, loopEnd: 66 },
    },
  } satisfies AudioManifest;
}

describe('AudioService', () => {
  let adapter: FakeAdapter;
  let svc: AudioService;

  beforeEach(async () => {
    adapter = new FakeAdapter();
    svc = new AudioService(adapter);
    await svc.preload(manifest());
  });

  it('sets volumes clamped to [0,1] and mutes/unmutes', () => {
    svc.setVolume('master', 1.2);
    svc.setVolume('music', -0.5);
    svc.setVolume('sfx', 0.33);
    expect(adapter.vols.master).toBe(1);
    expect(adapter.vols.music).toBe(0);
    expect(adapter.vols.sfx).toBeCloseTo(0.33, 1e-6);
    svc.muteAll(true);
    expect(adapter.muted).toBe(true);
    svc.muteAll(false);
    expect(adapter.muted).toBe(false);
  });

  it('enforces polyphony and cooldown for SFX', async () => {
    // rotate_cw has maxPoly=1
    svc.playSfx('rotate_cw');
    svc.playSfx('rotate_cw');
    // Only one should pass immediately
    expect(adapter.calls.filter((c) => c.m === 'playSfx').length).toBe(1);
    // Different SFX can play
    svc.playSfx('line_clear');
    expect(adapter.calls.filter((c) => c.m === 'playSfx').length).toBe(2);
  });

  it('starts, stops and crossfades music', () => {
    svc.playMusic('theme_main');
    svc.crossfade('theme_main', 0.6); // allowed even if same id; adapter decides behavior
    svc.stopMusic({ fadeSec: 0.2 });
    const seq = adapter.calls.map((c) => c.m).join(',');
    expect(seq).toContain('startMusic');
    expect(seq).toContain('crossfade');
    expect(seq).toContain('stopMusic');
  });
});
