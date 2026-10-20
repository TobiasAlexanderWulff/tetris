/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PauseOverlay } from './PauseOverlay';

describe('PauseOverlay', () => {
  it('shows overlay when visible', () => {
    const onRestart = vi.fn();
    render(<PauseOverlay visible={true} onRestart={onRestart} />);
    expect(screen.getByLabelText('pause-overlay')).toBeTruthy();
    expect(screen.getByText('Paused')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'resume' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'restart' }));
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'open-settings' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'open-help' })).toBeTruthy();
  });

  it('renders nothing when not visible', () => {
    const { container } = render(<PauseOverlay visible={false} onRestart={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
