/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultSettings, loadSettings } from './settings';

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
