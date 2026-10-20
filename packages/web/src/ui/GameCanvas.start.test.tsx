/* @vitest-environment jsdom */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { GameCanvas } from './GameCanvas';

describe('GameCanvas start interaction', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  beforeAll(() => {
    // Minimal 2D context mock for jsdom
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore jsdom lacks CanvasRenderingContext2D
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: () => {
        const ctx = {
          setTransform: () => {},
          clearRect: () => {},
          fillStyle: '#000',
          fillRect: () => {},
          strokeStyle: '#000',
          lineWidth: 1,
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          save: () => {},
          restore: () => {},
          globalAlpha: 1,
          getTransform: () => ({ a: 1, d: 1, b: 0, c: 0, e: 0, f: 0 }),
          translate: () => {},
          scale: () => {},
        };
        (ctx as Record<string, unknown>).canvas = document.createElement('canvas');
        return ctx as unknown as CanvasRenderingContext2D;
      },
    });
  });

  it('hides start overlay when the start button is activated', async () => {
    render(<GameCanvas />);
    expect(screen.getByLabelText('start-overlay')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('start-overlay')).toBeNull();
    });
  });

  it('does not render touch action buttons when touch mode is enabled', () => {
    localStorage.setItem('tetris:settings:v1', JSON.stringify({ touchControlsMode: 'on' }));

    render(<GameCanvas />);

    expect(screen.getByRole('button', { name: 'Pause game' })).toBeTruthy();
    expect(screen.queryByLabelText('touch-control-region')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hold' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rotate counterclockwise' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rotate clockwise' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rotate 180 degrees' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hard drop' })).toBeNull();
  });

  it('restarts immediately from the pause menu without showing the start overlay', async () => {
    render(<GameCanvas />);
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('start-overlay')).toBeNull();
    });

    fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });
    expect(await screen.findByLabelText('pause-overlay')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'restart' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('pause-overlay')).toBeNull();
      expect(screen.queryByLabelText('start-overlay')).toBeNull();
    });
    const hud = screen.getByLabelText('hud');
    expect(within(hud).getByText('Score:')).toBeTruthy();
    expect(within(hud).getAllByText('0')).toHaveLength(3);
  });
});
