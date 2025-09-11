/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighscoreTable } from './HighscoreTable';

const mk = (id: string, score: number) => ({
  id,
  score,
  lines: 10,
  level: 2,
  durationMs: 61000,
  timestamp: Date.now(),
  mode: 'marathon' as const,
  version: 1 as const,
});

describe('HighscoreTable', () => {
  it('renders empty state', () => {
    render(<HighscoreTable entries={[]} />);
    expect(screen.getByLabelText('empty-highscores')).toBeTruthy();
  });

  it('renders rows up to max', () => {
    const entries = [mk('a', 300), mk('b', 200), mk('c', 100)];
    render(<HighscoreTable entries={entries} max={2} />);
    const tables = screen.getAllByRole('table', { name: 'highscore-table' });
    expect(tables.length).toBeGreaterThan(0);
    expect(screen.getByText('300')).toBeTruthy();
    expect(screen.getByText('200')).toBeTruthy();
  });
});
