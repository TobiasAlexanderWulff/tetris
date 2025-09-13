import React from 'react';
import { useSettings } from '../state/settings';
import type { IAudio } from './types';
import { AudioService } from './AudioService';
import { WebAudioAdapter } from './WebAudioAdapter';
import { audioManifest } from './manifest';

const AudioCtx = React.createContext<IAudio | null>(null);

/**
 * Provides a singleton AudioService bound to WebAudio, and keeps it in sync
 * with user settings (master/music/sfx volumes and mute).
 */
export function AudioProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const { settings } = useSettings();
  const audioRef = React.useRef<IAudio | null>(null);
  const resumedRef = React.useRef(false);

  // Create service once
  if (!audioRef.current) {
    audioRef.current = new AudioService(new WebAudioAdapter());
  }

  // Sync volumes/mute from settings
  React.useEffect(() => {
    const audio = audioRef.current!;
    try {
      audio.setVolume('master', settings.audio.master);
      audio.setVolume('music', settings.audio.music);
      audio.setVolume('sfx', settings.audio.sfx);
      audio.muteAll(settings.audio.muted);
    } catch {
      // In test/jsdom or non-WebAudio envs, ignore initialization errors.
    }
  }, [settings.audio.master, settings.audio.music, settings.audio.sfx, settings.audio.muted]);

  // Resume on first user gesture (required by autoplay policies)
  React.useEffect(() => {
    const audio = audioRef.current!;
    const onGesture = () => {
      if (resumedRef.current) return;
      resumedRef.current = true;
      // Preload assets first (safe: manifest may be empty in MVP)
      void audio.preload(audioManifest).catch(() => {/* ignore in tests */});
      void audio.resumeOnUserGesture().catch(() => {
        // Ignore resume errors in non-WebAudio environments (e.g., jsdom tests)
      });
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture, { passive: true } as unknown as AddEventListenerOptions);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, []);

  return <AudioCtx.Provider value={audioRef.current}>{children}</AudioCtx.Provider>;
}

/** Access the shared AudioService instance. */
export function useAudio(): IAudio {
  const ctx = React.useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
