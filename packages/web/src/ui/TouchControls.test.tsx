/* @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TouchControls } from './TouchControls';

describe('TouchControls', () => {
  afterEach(() => {
    cleanup();
  });

  it('maps each visible button to its touch action', () => {
    const onAction = vi.fn();
    render(<TouchControls allow180={true} disabled={false} onAction={onAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Hold' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rotate counterclockwise' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rotate clockwise' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rotate 180 degrees' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hard drop' }));

    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      'Hold',
      'RotateCCW',
      'RotateCW',
      'Rotate180',
      'HardDrop',
    ]);
  });

  it('hides 180 degree rotation when the engine option is disabled', () => {
    render(<TouchControls allow180={false} disabled={false} onAction={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Rotate 180 degrees' })).toBeNull();
  });

  it('disables every action button while gameplay input is unavailable', () => {
    render(<TouchControls allow180={true} disabled={true} onAction={() => {}} />);

    for (const button of screen.getAllByRole('button')) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});
