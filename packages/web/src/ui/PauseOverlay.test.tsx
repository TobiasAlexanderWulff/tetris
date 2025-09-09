/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PauseOverlay } from './PauseOverlay';

describe('PauseOverlay', () => {
  it('shows overlay when visible', () => {
    render(<PauseOverlay visible={true} />);
    expect(screen.getByLabelText('pause-overlay')).toBeTruthy();
    expect(screen.getByText('Paused')).toBeTruthy();
  });

  it('renders nothing when not visible', () => {
    const { container } = render(<PauseOverlay visible={false} />);
    expect(container.firstChild).toBeNull();
  });
});

