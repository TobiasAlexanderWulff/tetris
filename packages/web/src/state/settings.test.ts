/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ARR_MAX_MS,
  ARR_MIN_MS,
  DAS_MAX_MS,
  DAS_MIN_MS,
  defaultSettings,
  loadSettings,
} from './settings';

const KEY = 'tetris:settings:v1';

/** Store a raw settings object, bypassing load-time validation. */
function store(patch: Record<string, unknown>): void {
  localStorage.setItem(KEY, JSON.stringify({ ...defaultSettings(), ...patch }));
}

describe('touch control settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults touch controls to auto', () => {
    expect(defaultSettings().touchControlsMode).toBe('auto');
  });

  it('migrates stored settings that predate touch controls', () => {
    localStorage.setItem(
      'tetris:settings:v1',
      JSON.stringify({
        ...defaultSettings(),
        touchControlsMode: undefined,
      }),
    );

    const loaded = loadSettings();

    expect(loaded.touchControlsMode).toBe('auto');
    expect(JSON.parse(localStorage.getItem('tetris:settings:v1') ?? '{}')).toMatchObject({
      touchControlsMode: 'auto',
    });
  });

  it('coerces invalid stored touch control modes to auto', () => {
    localStorage.setItem(
      'tetris:settings:v1',
      JSON.stringify({
        ...defaultSettings(),
        touchControlsMode: 'sometimes',
      }),
    );

    expect(loadSettings().touchControlsMode).toBe('auto');
  });
});

describe('settings validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clamps stored timing values into supported ranges', () => {
    store({ das: -50, arr: 0 });
    let loaded = loadSettings();
    expect(loaded.das).toBe(DAS_MIN_MS);
    expect(loaded.arr).toBe(ARR_MIN_MS);

    store({ das: 10_000, arr: 10_000 });
    loaded = loadSettings();
    expect(loaded.das).toBe(DAS_MAX_MS);
    expect(loaded.arr).toBe(ARR_MAX_MS);
  });

  it('does not hang when ARR is stored as zero', () => {
    store({ arr: 0 });
    const loaded = loadSettings();
    expect(loaded.arr).toBeGreaterThan(0);
    // Repaired values are written back so a reload stays safe.
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toMatchObject({ arr: ARR_MIN_MS });
  });

  it('falls back to defaults for non-numeric timing values', () => {
    store({ das: 'fast', arr: null });
    const loaded = loadSettings();
    expect(loaded.das).toBe(defaultSettings().das);
    expect(loaded.arr).toBe(defaultSettings().arr);
  });

  it('clamps audio levels and validates the mute flag', () => {
    store({ audio: { master: 2, music: -1, sfx: 0.5, muted: 'yes' } });
    expect(loadSettings().audio).toEqual({ master: 1, music: 0, sfx: 0.5, muted: false });

    store({ audio: { master: Number.NaN } });
    expect(loadSettings().audio).toEqual(defaultSettings().audio);
  });

  it('rejects malformed bindings and keeps defaults', () => {
    store({ bindings: 'nope' });
    expect(loadSettings().bindings).toEqual(defaultSettings().bindings);

    store({
      bindings: [
        { code: '', action: 'Left' },
        { code: 'KeyQ', action: 'Explode' },
      ],
    });
    expect(loadSettings().bindings).toEqual(defaultSettings().bindings);
  });

  it('drops invalid bindings while keeping valid ones', () => {
    store({
      bindings: [
        { code: 'KeyA', action: 'Left' },
        { code: 'KeyB', action: 'NotAnAction' },
        { code: 42, action: 'Right' },
        { code: 'KeyC', action: 'Rotate180' },
      ],
    });
    expect(loadSettings().bindings).toEqual([
      { code: 'KeyA', action: 'Left' },
      { code: 'KeyC', action: 'Rotate180' },
    ]);
  });

  it('adds a Rotate180 binding when missing', () => {
    store({ bindings: [{ code: 'KeyA', action: 'Left' }] });
    expect(loadSettings().bindings).toContainEqual({ code: 'KeyC', action: 'Rotate180' });
  });

  it('normalizes invalid mouse sensitivity values', () => {
    store({ mouseSensitivityPxPerCell: 0 });
    expect(loadSettings().mouseSensitivityPxPerCell).toBe('auto');

    store({ mouseSensitivityPxPerCell: -10 });
    expect(loadSettings().mouseSensitivityPxPerCell).toBe('auto');

    store({ mouseSensitivityPxPerCell: 32 });
    expect(loadSettings().mouseSensitivityPxPerCell).toBe(32);
  });

  it('falls back to defaults when storage is not a settings object', () => {
    localStorage.setItem(KEY, JSON.stringify([1, 2, 3]));
    expect(loadSettings()).toEqual(defaultSettings());

    localStorage.setItem(KEY, 'not json');
    expect(loadSettings()).toEqual(defaultSettings());
  });
});
