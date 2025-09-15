/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

  it('shows new highscore banner and table when provided', () => {
    const { container } = render(
      <GameOverOverlay
        visible={true}
        score={123}
        level={4}
        lines={10}
        newHigh={true}
        rank={1}
        top={[
          { id: 'x', score: 999, lines: 10, level: 1, durationMs: 1000, timestamp: Date.now(), mode: 'marathon', version: 1 },
        ]}
        onRestart={() => {}}
      />,
    );
    expect(screen.getByLabelText('new-highscore')).toBeTruthy();
    expect(screen.getByRole('table', { name: 'highscore-table' })).toBeTruthy();
  });

  it('constrains height and makes content scrollable', () => {
    const { container } = render(
      <GameOverOverlay
        visible={true}
        score={123}
        level={4}
        lines={10}
        top={new Array(20).fill(0).map((_, i) => ({
          id: String(i),
          score: 1000 - i,
          lines: i,
          level: 1,
          durationMs: 1000 * (i + 1),
          timestamp: Date.now(),
          mode: 'marathon',
          version: 1,
        }))}
        onRestart={() => {}}
      />,
    );
    const content = within(container).getByLabelText('game-over-content') as HTMLElement;
    expect(content).toBeTruthy();
    expect(content.style.overflowY === 'auto' || content.style.overflowY === 'scroll').toBe(true);
  });
});
