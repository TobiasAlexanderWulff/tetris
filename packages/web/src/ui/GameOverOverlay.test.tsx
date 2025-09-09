/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverOverlay } from './GameOverOverlay';

describe('GameOverOverlay', () => {
  it('renders stats and handles restart', () => {
    const onRestart = vi.fn();
    render(<GameOverOverlay visible={true} score={123} level={4} lines={10} onRestart={onRestart} />);
    expect(screen.getByLabelText('game-over')).toBeTruthy();
    expect(screen.getByText('Score')).toBeTruthy();
    expect(screen.getByText('123')).toBeTruthy();
    const btn = screen.getByLabelText('restart');
    fireEvent.click(btn);
    expect(onRestart).toHaveBeenCalled();
  });
});

