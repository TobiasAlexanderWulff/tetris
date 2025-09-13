import type { AudioManifest, IAudioAdapter } from './types';

/**
 * Minimal Web Audio adapter. It owns the AudioContext, gain buses, and decoded buffers.
 * The implementation is intentionally conservative for MVP and designed to be
 * easily unit-tested via dependency injection if needed.
 */
export class WebAudioAdapter implements IAudioAdapter {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private manifest: AudioManifest | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private currentMusic: { id: string; node: AudioBufferSourceNode; gain: GainNode } | null = null;

  /** Lazily create the AudioContext and bus graph. */
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const W = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = W.AudioContext ?? W.webkitAudioContext;
      if (!Ctor) throw new Error('Web Audio is not supported in this environment');
      const ctx = new Ctor({ latencyHint: 'interactive' } as AudioContextOptions);
      const master = ctx.createGain();
      const music = ctx.createGain();
      const sfx = ctx.createGain();
      music.connect(master);
      sfx.connect(master);
      master.connect(ctx.destination);
      master.gain.value = 0.8;
      music.gain.value = 0.6;
      sfx.gain.value = 0.9;
      this.ctx = ctx;
      this.master = master;
      this.musicBus = music;
      this.sfxBus = sfx;
    }
    return this.ctx!;
  }

  /** Preload and decode manifest assets. */
  async preload(manifest: AudioManifest): Promise<void> {
    this.manifest = manifest;
    // No-op if empty
    if (!manifest || (!Object.keys(manifest.sfx).length && !Object.keys(manifest.music).length)) return;
    const ctx = this.ensureCtx();
    const entries: [string, string][] = [
      ...Object.entries(manifest.sfx).map(([id, def]) => [`sfx:${id}`, def.url] as [string, string]),
      ...Object.entries(manifest.music).map(([id, def]) => [`music:${id}`, def.url] as [string, string]),
    ];
    // Fetch in parallel; allow failures to be caught per asset.
    await Promise.allSettled(
      entries.map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          const arr = await res.arrayBuffer();
          const buf = await ctx.decodeAudioData(arr.slice(0));
          this.buffers.set(key, buf);
        } catch (err) {
          // Tolerate missing/decoding failures; leave buffer absent.
          // eslint-disable-next-line no-console
          console.warn('[audio] failed to load', url, err);
        }
      })
    );
  }

  /** Resume audio context after a user gesture. */
  async resume(): Promise<void> {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();
  }

  /** Play a decoded one‑shot SFX buffer. */
  playSfx(id: string, opts: { detuneCents?: number; gain?: number }): void {
    if (!this.manifest) return;
    const ctx = this.ensureCtx();
    const def = this.manifest.sfx[id];
    if (!def) return;
    const key = `sfx:${id}`;
    const buf = this.buffers.get(key);
    if (!buf) return;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const base = def.gain ?? 1;
    g.gain.value = (opts.gain ?? 1) * base;
    if (typeof src.detune !== 'undefined' && opts.detuneCents) src.detune.value = opts.detuneCents;
    src.connect(g);
    g.connect(this.sfxBus!);
    const when = ctx.currentTime;
    src.start(when);
    // Auto stop
    src.onended = () => {
      try {
        src.disconnect();
        g.disconnect();
      } catch {
        /* ignore */
      }
    };
  }

  /** Start a music track, replacing any existing one. */
  startMusic(id: string, opts: { loop?: boolean; startAt?: number }): void {
    if (!this.manifest) return;
    const ctx = this.ensureCtx();
    const def = this.manifest.music[id];
    if (!def) return;
    const key = `music:${id}`;
    const buf = this.buffers.get(key);
    if (!buf) return;

    // Stop previous
    if (this.currentMusic) {
      try {
        this.currentMusic.node.stop();
        this.currentMusic.node.disconnect();
        this.currentMusic.gain.disconnect();
      } catch {
        /* ignore */
      }
      this.currentMusic = null;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = def.gain ?? 1;
    src.connect(g);
    g.connect(this.musicBus!);

    src.loop = opts.loop ?? def.loop ?? true;
    if (def.loopStart != null) src.loopStart = def.loopStart;
    if (def.loopEnd != null) src.loopEnd = def.loopEnd;
    src.start(ctx.currentTime, opts.startAt ?? 0);
    this.currentMusic = { id, node: src, gain: g };
  }

  /** Stop current music, optionally fading out. */
  stopMusic(opts: { fadeSec?: number }): void {
    if (!this.currentMusic) return;
    const ctx = this.ensureCtx();
    const { node, gain } = this.currentMusic;
    const fade = Math.max(0, opts.fadeSec ?? 0);
    if (fade > 0) {
      const now = ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + fade);
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        try {
          node.stop();
          node.disconnect();
          gain.disconnect();
        } catch {
          /* ignore */
        }
      }, fade * 1000);
    } else {
      try {
        node.stop();
        node.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.currentMusic = null;
  }

  /** Crossfade from current track to a new one over the given seconds. */
  crossfade(toId: string, seconds: number): void {
    const ctx = this.ensureCtx();
    const prev = this.currentMusic;
    // Start new first
    this.startMusic(toId, {});
    const next = this.currentMusic;
    if (!next) return;
    const dur = Math.max(0.1, seconds);
    const now = ctx.currentTime;
    try {
      next.gain.gain.cancelScheduledValues(now);
      next.gain.gain.setValueAtTime(0, now);
      next.gain.gain.linearRampToValueAtTime(1, now + dur);
    } catch {
      /* ignore */
    }
    if (prev) {
      try {
        prev.gain.gain.cancelScheduledValues(now);
        prev.gain.gain.setValueAtTime(prev.gain.gain.value, now);
        prev.gain.gain.linearRampToValueAtTime(0, now + dur);
      } catch {
        /* ignore */
      }
      // Stop only the previous node after the fade, without touching current
      setTimeout(() => {
        try {
          prev.node.stop();
          prev.node.disconnect();
          prev.gain.disconnect();
        } catch {
          /* ignore */
        }
      }, dur * 1000 + 30);
    }
  }

  /** Adjust a bus volume immediately. */
  setBusVolume(kind: 'master' | 'music' | 'sfx', value: number): void {
    const ctx = this.ensureCtx();
    const node = kind === 'master' ? this.master : kind === 'music' ? this.musicBus : this.sfxBus;
    const g = node!.gain;
    try {
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(value, ctx.currentTime);
    } catch {
      g.value = value;
    }
  }

  /** Mute/unmute master with a fast ramp to avoid clicks. */
  setMuted(flag: boolean): void {
    const ctx = this.ensureCtx();
    const target = flag ? 0 : this.master!.gain.value || 1;
    const now = ctx.currentTime;
    try {
      this.master!.gain.cancelScheduledValues(now);
      this.master!.gain.setValueAtTime(this.master!.gain.value, now);
      this.master!.gain.linearRampToValueAtTime(target, now + 0.02);
    } catch {
      this.master!.gain.value = target;
    }
  }
}
