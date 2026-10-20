/* @vitest-environment jsdom */
import React, { createRef } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameLayout } from './GameLayout';

describe('GameLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the desktop playfield without touch controls', () => {
    render(
      <GameLayout
        canvasRef={createRef<HTMLCanvasElement>()}
        touchControlsEnabled={false}
        pauseDisabled={false}
        onPause={() => {}}
        hud={<div>HUD</div>}
        hold={<div>HOLD</div>}
        next={<div>NEXT</div>}
      />,
    );

    expect(screen.getByLabelText('game-layout').dataset.touchControls).toBe('false');
    expect(screen.queryByLabelText('touch-control-region')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pause game' })).toBeNull();
  });

  it('renders a semantic pause button without a touch action region', () => {
    const onPause = vi.fn();
    render(
      <GameLayout
        canvasRef={createRef<HTMLCanvasElement>()}
        touchControlsEnabled={true}
        pauseDisabled={false}
        onPause={onPause}
        hud={<div>HUD</div>}
        hold={<div>HOLD</div>}
        next={<div>NEXT</div>}
      />,
    );

    expect(screen.getByLabelText('game-layout').dataset.touchControls).toBe('true');
    expect(screen.queryByLabelText('touch-control-region')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('groups landscape HUD and hold on the left and the preview on the right', () => {
    render(
      <GameLayout
        canvasRef={createRef<HTMLCanvasElement>()}
        touchControlsEnabled={true}
        pauseDisabled={false}
        onPause={() => {}}
        hud={<div>HUD</div>}
        hold={<div>HOLD</div>}
        next={<div>NEXT</div>}
      />,
    );

    const leftRail = screen.getByLabelText('left-game-controls');
    expect(within(leftRail).getByText('HUD')).toBeTruthy();
    expect(within(leftRail).getByText('HOLD')).toBeTruthy();
    expect(within(leftRail).getByRole('button', { name: 'Pause game' })).toBeTruthy();

    expect(
      screen.getByLabelText('board-region').contains(screen.getByLabelText('Tetris board')),
    ).toBe(true);

    const rightRail = screen.getByLabelText('right-game-controls');
    expect(within(rightRail).getByText('NEXT')).toBeTruthy();
    expect(within(rightRail).queryByRole('button')).toBeNull();
  });

  it('disables the mobile pause action before gameplay starts', () => {
    render(
      <GameLayout
        canvasRef={createRef<HTMLCanvasElement>()}
        touchControlsEnabled={true}
        pauseDisabled={true}
        onPause={() => {}}
        hud={<div>HUD</div>}
        hold={<div>HOLD</div>}
        next={<div>NEXT</div>}
      />,
    );

    expect((screen.getByRole('button', { name: 'Pause game' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
