/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { SettingsProvider } from '../state/settings';

const STORAGE_KEY = 'tetris:settings:v1';

describe('SettingsModal audio volumes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders music and SFX sliders with the stored defaults', () => {
    render(
      <SettingsProvider>
        <SettingsModal onClose={() => {}} />
      </SettingsProvider>,
    );

    expect((screen.getByLabelText('Master Volume') as HTMLInputElement).value).toBe('0.8');
    expect((screen.getByLabelText('Music Volume') as HTMLInputElement).value).toBe('0.6');
    expect((screen.getByLabelText('SFX Volume') as HTMLInputElement).value).toBe('0.9');
  });

  it('persists music and SFX volume changes without touching master volume', () => {
    render(
      <SettingsProvider>
        <SettingsModal onClose={() => {}} />
      </SettingsProvider>,
    );

    const music = screen.getByLabelText('Music Volume') as HTMLInputElement;
    const sfx = screen.getByLabelText('SFX Volume') as HTMLInputElement;
    fireEvent.change(music, { target: { value: '0.25' } });
    fireEvent.change(sfx, { target: { value: '0.4' } });

    expect(music.value).toBe('0.25');
    expect(sfx.value).toBe('0.4');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      audio?: Record<string, number | boolean>;
    };
    expect(stored.audio).toEqual({
      master: 0.8,
      music: 0.25,
      sfx: 0.4,
      muted: false,
    });
  });
});
