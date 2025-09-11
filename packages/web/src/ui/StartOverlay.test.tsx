/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StartOverlay } from './StartOverlay';

describe('StartOverlay', () => {
  it('renders when visible with animated prompt', () => {
    render(<StartOverlay visible={true} />);
    expect(screen.getByLabelText('start-overlay')).toBeTruthy();
    expect(screen.getByText(/press to start/i)).toBeTruthy();
  });

  it('renders nothing when not visible', () => {
    const { container } = render(<StartOverlay visible={false} />);
    expect(container.firstChild).toBeNull();
  });
});
