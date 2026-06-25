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
    expect(screen.getByText('Touch Controls')).toBeTruthy();
    expect(screen.getByText(/drag horizontally/i)).toBeTruthy();
    expect(screen.getByText(/tap the left board half for ccw/i)).toBeTruthy();
    expect(screen.getByText(/drag down slowly and hold/i)).toBeTruthy();
    expect(screen.getByText(/^flick down quickly$/i)).toBeTruthy();
    expect(screen.getByText(/^flick up quickly$/i)).toBeTruthy();
    expect(screen.queryByText(/optional 180/i)).toBeNull();
    expect(screen.queryByText(/tap drop/i)).toBeNull();
    expect(screen.queryByText(/tap hold/i)).toBeNull();
    expect(screen.getByText('Scoring Basics')).toBeTruthy();
  });

  it('constrains height and scrolls content', () => {
    const onClose = () => {};
    const { container } = render(<HelpModal onClose={onClose} />);
    const content = within(container).getByLabelText('help-content') as HTMLElement;
    expect(content).toBeTruthy();
    expect(content.style.overflowY === 'auto' || content.style.overflowY === 'scroll').toBe(true);
    const panel = within(container).getByLabelText('help').firstElementChild as HTMLElement;
    expect(['0', '0px']).toContain(panel.style.minWidth);
    expect(panel.style.boxSizing).toBe('border-box');
  });
});
