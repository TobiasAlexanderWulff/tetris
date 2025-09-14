/* @vitest-environment jsdom */
import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { GameCanvas } from './GameCanvas';

describe('GameCanvas start interaction', () => {
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

  it('hides start overlay on pointer down', async () => {
    render(<GameCanvas />);
    expect(screen.getByLabelText('start-overlay')).toBeTruthy();

    window.dispatchEvent(new Event('pointerdown'));

    await waitFor(() => {
      expect(screen.queryByLabelText('start-overlay')).toBeNull();
    });
  });
});
