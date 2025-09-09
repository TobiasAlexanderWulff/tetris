/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { updateBindings } from './updateBindings';
import type { KeyBinding } from './types';

describe('updateBindings', () => {
  it('adds a new binding when action has none', () => {
    const next = updateBindings([], 'Left', 'KeyA');
    expect(next).toEqual([{ action: 'Left', code: 'KeyA' }]);
  });

  it('replaces the first binding for the action', () => {
    const prev: KeyBinding[] = [
      { action: 'RotateCW', code: 'ArrowUp' },
      { action: 'RotateCW', code: 'KeyX' },
    ];
    const next = updateBindings(prev, 'RotateCW', 'KeyC');
    expect(next[0]).toEqual({ action: 'RotateCW', code: 'KeyC' });
    expect(next[1]).toEqual({ action: 'RotateCW', code: 'KeyX' });
  });

  it('removes conflicting binding using the same code', () => {
    const prev: KeyBinding[] = [
      { action: 'Left', code: 'ArrowLeft' },
      { action: 'Right', code: 'ArrowRight' },
    ];
    const next = updateBindings(prev, 'Right', 'ArrowLeft');
    // Left's ArrowLeft removed; Right now uses ArrowLeft
    expect(next.find((b) => b.action === 'Left')).toBeUndefined();
    expect(next.find((b) => b.action === 'Right')?.code).toBe('ArrowLeft');
  });
});

