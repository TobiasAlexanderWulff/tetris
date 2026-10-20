import React from 'react';
import type { InputAction, KeyBinding } from '../input/types';

/** User preference controlling when the mobile touch interface is visible. */
export type TouchControlsMode = 'auto' | 'on' | 'off';

/** Lowest allowed DAS value in milliseconds. A value of 0 starts repeat immediately. */
export const DAS_MIN_MS = 0;
/** Highest allowed DAS value in milliseconds. */
export const DAS_MAX_MS = 1000;

/**
 * Lowest allowed ARR value in milliseconds.
 *
 * ARR controls the delay between repeated horizontal moves after DAS. Some
 * Tetris implementations treat ARR=0 as "instant", but an instant repeat is
 * an unbounded loop for a frame-based input poller. We therefore use 1 ms as
 * the fastest supported setting: at typical 60 Hz polling this still moves
 * once per frame, while keeping the repeat loop finite.
 */
export const ARR_MIN_MS = 1;
/** Highest allowed ARR value in milliseconds. */
export const ARR_MAX_MS = 1000;

const THEMES: readonly Settings['theme'][] = ['default', 'dark', 'high-contrast', 'color-blind'];
const TOUCH_MODES: readonly TouchControlsMode[] = ['auto', 'on', 'off'];
const INPUT_ACTIONS: readonly InputAction[] = [
  'Left',
  'Right',
  'RotateCW',
  'RotateCCW',
  'Rotate180',
  'SoftDrop',
  'HardDrop',
  'Hold',
  'Pause',
];

export interface Settings {
  das: number; // ms
  arr: number; // ms
  allow180: boolean;
  bindings: KeyBinding[];
  audio: { master: number; music: number; sfx: number; muted: boolean };
  theme: 'default' | 'dark' | 'high-contrast' | 'color-blind';
  animations: boolean;
  /** Enable mouse-only input controls. */
  mouseControls: boolean;
  /** Pixels-per-cell sensitivity or 'auto' to derive from layout. */
  mouseSensitivityPxPerCell: number | 'auto';
  /** Automatic, forced, or disabled mobile touch controls. */
  touchControlsMode: TouchControlsMode;
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
    mouseControls: false,
    mouseSensitivityPxPerCell: 'auto',
    touchControlsMode: 'auto',
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

/**
 * Load settings from localStorage, validating and repairing stored values.
 * Invalid or incomplete data falls back to defaults; repairs are persisted.
 */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return defaultSettings();
    }
    const settings = normalizeSettings(parsed as Record<string, unknown>);
    // Persist migrations and repairs so invalid data does not linger in storage.
    if (JSON.stringify(settings) !== JSON.stringify(parsed)) {
      saveSettings(settings);
    }
    return settings;
  } catch {
    return defaultSettings();
  }
}

/**
 * Coerce stored (potentially invalid) settings into a complete, safe Settings
 * object. Missing or malformed fields fall back to their defaults; numeric
 * timing and audio values are clamped to supported ranges.
 */
function normalizeSettings(parsed: Record<string, unknown>): Settings {
  const defaults = defaultSettings();
  const bindings = normalizeBindings(parsed.bindings, defaults.bindings);
  const settings: Settings = {
    das: clampNumber(parsed.das, defaults.das, DAS_MIN_MS, DAS_MAX_MS),
    arr: clampNumber(parsed.arr, defaults.arr, ARR_MIN_MS, ARR_MAX_MS),
    allow180: typeof parsed.allow180 === 'boolean' ? parsed.allow180 : defaults.allow180,
    bindings,
    audio: normalizeAudio(parsed.audio, defaults.audio),
    theme: isOneOf(parsed.theme, THEMES) ? parsed.theme : defaults.theme,
    animations: typeof parsed.animations === 'boolean' ? parsed.animations : defaults.animations,
    mouseControls:
      typeof parsed.mouseControls === 'boolean' ? parsed.mouseControls : defaults.mouseControls,
    mouseSensitivityPxPerCell: normalizeMouseSensitivity(
      parsed.mouseSensitivityPxPerCell,
      defaults.mouseSensitivityPxPerCell,
    ),
    touchControlsMode: isOneOf(parsed.touchControlsMode, TOUCH_MODES)
      ? parsed.touchControlsMode
      : defaults.touchControlsMode,
  };
  // Ensure a 180° binding exists to support updated defaults.
  if (!settings.bindings.some((b) => b.action === 'Rotate180')) {
    settings.bindings = [...settings.bindings, { code: 'KeyC', action: 'Rotate180' }];
  }
  return settings;
}

/** Clamp a stored number to a range, falling back when it is not finite. */
function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

/** Type guard for string-literal option lists. */
function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

/** Validate stored key bindings, falling back to defaults when unusable. */
function normalizeBindings(value: unknown, fallback: readonly KeyBinding[]): KeyBinding[] {
  if (!Array.isArray(value)) return [...fallback];
  const valid = value.filter(
    (entry): entry is KeyBinding =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as KeyBinding).code === 'string' &&
      (entry as KeyBinding).code.length > 0 &&
      isOneOf((entry as KeyBinding).action, INPUT_ACTIONS),
  );
  return valid.length > 0 ? valid.map((b) => ({ code: b.code, action: b.action })) : [...fallback];
}

/** Validate stored audio levels and mute flag. */
function normalizeAudio(value: unknown, fallback: Settings['audio']): Settings['audio'] {
  const audio = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    master: clampNumber(audio.master, fallback.master, 0, 1),
    music: clampNumber(audio.music, fallback.music, 0, 1),
    sfx: clampNumber(audio.sfx, fallback.sfx, 0, 1),
    muted: typeof audio.muted === 'boolean' ? audio.muted : fallback.muted,
  };
}

/** Validate the mouse sensitivity setting: 'auto' or a positive number. */
function normalizeMouseSensitivity(value: unknown, fallback: number | 'auto'): number | 'auto' {
  if (value === 'auto') return 'auto';
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  return fallback;
}

/** Persist settings to localStorage, ignoring storage failures. */
export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage may be unavailable (private mode, quota); settings still work in memory.
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
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Ctx {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
