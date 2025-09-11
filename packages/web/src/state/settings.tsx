import React from 'react';
import type { KeyBinding } from '../input/types';

export interface Settings {
  das: number; // ms
  arr: number; // ms
  allow180: boolean;
  bindings: KeyBinding[];
  audio: { master: number; music: number; sfx: number; muted: boolean };
  theme: 'default' | 'dark' | 'high-contrast' | 'color-blind';
  animations: boolean;
}

const KEY = 'tetris:settings:v1';

/**
 * Compute default settings, honoring system preferences such as reduced motion.
 */
export function defaultSettings(): Settings {
  // Respect prefers-reduced-motion by disabling animations by default.
  let animationsDefault = true;
  try {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      animationsDefault = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  } catch {
    // ignore
  }
  return {
    das: 150,
    arr: 33,
    allow180: false,
    theme: 'dark',
    animations: animationsDefault,
    bindings: [
      { code: 'ArrowLeft', action: 'Left' },
      { code: 'ArrowRight', action: 'Right' },
      { code: 'ArrowUp', action: 'RotateCW' },
      { code: 'KeyZ', action: 'RotateCCW' },
      { code: 'KeyX', action: 'RotateCW' },
      { code: 'KeyC', action: 'Rotate180' },
      { code: 'Space', action: 'HardDrop' },
      { code: 'ShiftLeft', action: 'Hold' },
      { code: 'ArrowDown', action: 'SoftDrop' },
    ],
    audio: { master: 0.8, music: 0.6, sfx: 0.9, muted: false },
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw);
    const merged = { ...defaultSettings(), ...parsed } as Settings;
    // Ensure a 180° binding exists to support updated defaults
    if (!merged.bindings.some((b) => b.action === 'Rotate180')) {
      merged.bindings = [...merged.bindings, { code: 'KeyC', action: 'Rotate180' }];
      // Persist migration
      saveSettings(merged);
    }
    // Theme migration: coerce unknown theme values to 'dark'
    if (
      merged.theme !== 'default' &&
      merged.theme !== 'dark' &&
      merged.theme !== 'high-contrast' &&
      merged.theme !== 'color-blind'
    ) {
      merged.theme = 'dark';
      saveSettings(merged);
    }
    return merged;
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    // ignore
  }
}

type Ctx = {
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
};

const SettingsContext = React.createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [settings, setSettingsState] = React.useState<Settings>(() => loadSettings());
  const setSettings = React.useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch } as Settings;
      saveSettings(next);
      return next;
    });
  }, []);
  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): Ctx {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
