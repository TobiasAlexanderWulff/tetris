/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { StartOverlay } from './StartOverlay';

describe('StartOverlay', () => {
  it('renders when visible with animated prompt', () => {
    const onStart = vi.fn();
    render(<StartOverlay visible={true} onStart={onStart} />);
    expect(screen.getByLabelText('start-overlay')).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Start game' });
    expect(button.style.appearance).toBe('none');
    expect(button.style.background).toBe('transparent');
    expect(['0', '0px']).toContain(button.style.borderWidth);
    expect(button.style.color).toBe('inherit');
    expect(button.classList.contains('overlay-action')).toBe(false);
    fireEvent.click(button);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when not visible', () => {
    const { container } = render(<StartOverlay visible={false} onStart={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
