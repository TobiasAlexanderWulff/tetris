/* @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TouchOnboarding } from './TouchOnboarding';

describe('TouchOnboarding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('explains drag movement once and persists dismissal locally', () => {
    const first = render(<TouchOnboarding visible={true} />);

    expect(screen.getByText(/drag horizontally/i)).toBeTruthy();
    expect(screen.getByText(/drag down slowly and hold/i)).toBeTruthy();
    expect(screen.getByText(/flick down quickly/i)).toBeTruthy();
    expect(screen.getByText(/flick up quickly/i)).toBeTruthy();
    expect(screen.getByText(/tap the left or right board half/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss touch hint' }));
    expect(screen.queryByLabelText('touch-onboarding')).toBeNull();

    first.unmount();
    render(<TouchOnboarding visible={true} />);
    expect(screen.queryByLabelText('touch-onboarding')).toBeNull();
  });

  it('stays hidden when touch controls are not active', () => {
    render(<TouchOnboarding visible={false} />);
    expect(screen.queryByLabelText('touch-onboarding')).toBeNull();
  });
});
