/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { HelpModal } from './HelpModal';

describe('HelpModal', () => {
  it('renders controls and can close', () => {
    const onClose = () => {};
    render(<HelpModal onClose={onClose} />);
    expect(screen.getByLabelText('help')).toBeTruthy();
    expect(screen.getByText('Controls')).toBeTruthy();
    expect(screen.getByText('Scoring Basics')).toBeTruthy();
  });

  it('constrains height and scrolls content', () => {
    const onClose = () => {};
    const { container } = render(<HelpModal onClose={onClose} />);
    const content = within(container).getByLabelText('help-content') as HTMLElement;
    expect(content).toBeTruthy();
    expect(content.style.overflowY === 'auto' || content.style.overflowY === 'scroll').toBe(true);
  });
});
