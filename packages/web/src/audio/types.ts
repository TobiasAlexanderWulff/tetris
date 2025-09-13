/**
 * Audio manifest types describing available SFX and music assets.
 */
export interface SfxDef {
  /** Public URL to the audio file. */
  url: string;
  /** Linear gain multiplier for this SFX (0..1). */
  gain?: number;
  /** Maximum concurrent voices allowed for this SFX. */
  maxPoly?: number;
}

export interface MusicDef {
  /** Public URL to the audio file. */
  url: string;
  /** Linear gain multiplier for this track (0..1). */
  gain?: number;
  /** Enable native loop. */
  loop?: boolean;
  /** Loop start position in seconds. */
  loopStart?: number;
  /** Loop end position in seconds. */
  loopEnd?: number;
}

export interface AudioManifest {
  sfx: Record<string, SfxDef>;
  music: Record<string, MusicDef>;
}

/**
 * Public audio control surface used by the app.
 */
export interface IAudio {
  /** Preload and decode assets from a manifest. */
  preload(manifest: AudioManifest): Promise<void>;
  /** Ensure the audio context is resumed after a user gesture. */
  resumeOnUserGesture(): Promise<void>;

  /** Play a one‑shot sound effect by id. */
  playSfx(id: string, opts?: { detuneCents?: number; gain?: number }): void;
  /** Start or switch music to the given track immediately. */
  playMusic(id: string, opts?: { loop?: boolean; startAt?: number }): void;
  /** Stop current music with an optional fade time. */
  stopMusic(opts?: { fadeSec?: number }): void;
  /** Crossfade from current music to another. */
  crossfade(toId: string, seconds: number): void;

  /**
   * Play the given music only if no track is currently active and no switch is pending.
   * Useful for default menu ambience that should not override an explicit gameplay request.
   */
  playIfIdle(id: string, opts?: { loop?: boolean; startAt?: number }): void;

  /** Set linear volume (0..1) for a given bus. */
  setVolume(kind: 'master' | 'music' | 'sfx', value: number): void;
  /** Mute or unmute all output (preserves volume settings). */
  muteAll(flag: boolean): void;
}

/**
 * Adapter interface to abstract Web Audio details for testing.
 */
export interface IAudioAdapter {
  preload(manifest: AudioManifest): Promise<void>;
  resume(): Promise<void>;

  playSfx(id: string, opts: { detuneCents?: number; gain?: number }): void;
  startMusic(id: string, opts: { loop?: boolean; startAt?: number }): void;
  stopMusic(opts: { fadeSec?: number }): void;
  crossfade(toId: string, seconds: number): void;

  setBusVolume(kind: 'master' | 'music' | 'sfx', value: number): void;
  setMuted(flag: boolean): void;
}
