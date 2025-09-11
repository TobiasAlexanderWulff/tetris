/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HUD } from './HUD';

describe('HUD', () => {
  it('renders score, level, and lines', () => {
    render(<HUD score={1234} level={7} lines={42} />);
    expect(screen.getByText('Score:')).toBeTruthy();
    expect(screen.getByText('1234')).toBeTruthy();
    expect(screen.getByText('Level:')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('Lines:')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders PB when provided', () => {
    render(<HUD score={0} level={0} lines={0} pb={999} />);
    expect(screen.getByText('Highscore:')).toBeTruthy();
    expect(screen.getByText('999')).toBeTruthy();
  });
});
