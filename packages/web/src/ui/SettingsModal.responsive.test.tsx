/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { SettingsProvider } from '../state/settings';

describe('SettingsModal (responsive)', () => {
  it('uses a scrollable content area on small viewports', () => {
    render(
      <SettingsProvider>
        <SettingsModal onClose={() => {}} />
      </SettingsProvider>,
    );
    expect(screen.getByLabelText('settings')).toBeTruthy();
    const content = screen.getByLabelText('settings-content') as HTMLElement;
    expect(content).toBeTruthy();
    expect(content.style.overflowY === 'auto' || content.style.overflowY === 'scroll').toBe(true);
    const panel = screen.getByLabelText('settings').firstElementChild as HTMLElement;
    expect(['0', '0px']).toContain(panel.style.minWidth);
    expect(panel.style.boxSizing).toBe('border-box');
    expect((screen.getByLabelText('Touch Controls') as HTMLSelectElement).value).toBe('auto');
  });
});
