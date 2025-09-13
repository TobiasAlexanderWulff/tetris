import type { AudioManifest, IAudio, IAudioAdapter } from './types';

/**
 * AudioService coordinates music/SFX playback and mixes, delegating
 * low-level work to an injected adapter (e.g., Web Audio).
 */
export class AudioService implements IAudio {
  private adapter: IAudioAdapter;
  private manifest: AudioManifest | null = null;
  private preloaded = false;
  private pendingMusic: { kind: 'start'; id: string } | { kind: 'xfade'; id: string; seconds: number } | null = null;
  private muted = false;
  private volumes: Record<'master' | 'music' | 'sfx', number> = { master: 0.8, music: 0.6, sfx: 0.9 };
  private currentMusic: string | null = null;
  // Per-SFX cooldown in milliseconds to avoid chatter
  private cooldownMs = 40;
  private lastPlayedAt = new Map<string, number>();
  private polyphony = new Map<string, number>();

  /**
   * Create a new AudioService bound to an adapter implementation.
   */
  constructor(adapter: IAudioAdapter) {
    this.adapter = adapter;
  }

  /**
   * Load and decode assets from a manifest; resets internal counters.
   */
  async preload(manifest: AudioManifest): Promise<void> {
    this.manifest = manifest;
    this.lastPlayedAt.clear();
    this.polyphony.clear();
    await this.adapter.preload(manifest);
    this.preloaded = true;
    // If a music request came in before preload completed, honor it now
    if (this.pendingMusic) {
      const req = this.pendingMusic;
      this.pendingMusic = null;
      if (req.kind === 'start') this.playMusic(req.id);
      else this.crossfade(req.id, req.seconds);
    }
  }

  /**
   * Ensure audio context is running after a user gesture.
   */
  async resumeOnUserGesture(): Promise<void> {
    await this.adapter.resume();
  }

  /**
   * Play a one-shot SFX by id, enforcing polyphony caps and a short cooldown.
   */
  playSfx(id: string, opts?: { detuneCents?: number; gain?: number }): void {
    if (!this.manifest) return;
    if (!this.manifest.sfx[id]) return;

    const now = Date.now();
    const last = this.lastPlayedAt.get(id) ?? 0;
    if (now - last < this.cooldownMs) return;

    const maxPoly = this.manifest.sfx[id].maxPoly ?? 8;
    const active = this.polyphony.get(id) ?? 0;
    if (active >= maxPoly) return;

    this.polyphony.set(id, active + 1);
    try {
      this.adapter.playSfx(id, opts ?? {});
    } finally {
      // Decrease polyphony after a short delay; we don't track exact buffer length in the service.
      setTimeout(() => {
        const cur = this.polyphony.get(id) ?? 1;
        this.polyphony.set(id, Math.max(0, cur - 1));
      }, 100);
      this.lastPlayedAt.set(id, now);
    }
  }

  /**
   * Start playing a music track immediately, replacing any current track.
   */
  playMusic(id: string, opts?: { loop?: boolean; startAt?: number }): void {
    if (!this.manifest || !this.manifest.music[id]) return;
    if (!this.preloaded) {
      this.pendingMusic = { kind: 'start', id };
      return;
    }
    this.currentMusic = id;
    this.adapter.startMusic(id, { loop: opts?.loop, startAt: opts?.startAt });
  }

  /** Stop current music with optional fade-out. */
  stopMusic(opts?: { fadeSec?: number }): void {
    this.adapter.stopMusic({ fadeSec: opts?.fadeSec ?? 0 });
    this.currentMusic = null;
  }

  /** Crossfade from current music to a new track over the given duration. */
  crossfade(toId: string, seconds: number): void {
    if (!this.manifest || !this.manifest.music[toId]) return;
    if (!this.preloaded) {
      this.pendingMusic = { kind: 'xfade', id: toId, seconds };
      return;
    }
    this.currentMusic = toId;
    this.adapter.crossfade(toId, seconds);
  }

  /** Only start music if nothing is active or pending. */
  playIfIdle(id: string, opts?: { loop?: boolean; startAt?: number }): void {
    if (!this.manifest || !this.manifest.music[id]) return;
    if (!this.preloaded) return; // wait until preloaded; provider can retry later if desired
    if (this.pendingMusic) return;
    if (this.currentMusic) return;
    this.playMusic(id, opts);
  }

  /** Set linear volume for a bus and propagate to the adapter. */
  setVolume(kind: 'master' | 'music' | 'sfx', value: number): void {
    const v = clamp01(value);
    // Store local copy for potential future persistence via settings
    this.volumes[kind] = v;
    this.adapter.setBusVolume(kind, v);
  }

  /** Mute or unmute all output without losing bus volumes. */
  muteAll(flag: boolean): void {
    this.muted = !!flag;
    this.adapter.setMuted(this.muted);
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
