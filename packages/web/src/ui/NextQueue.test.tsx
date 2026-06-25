/* @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPalette } from '../renderer/colors';
import { NextQueue } from './NextQueue';

/** Install a deterministic media-query result for responsive queue tests. */
function mockCompactLandscape(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('NextQueue', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the full queue outside compact landscape', () => {
    mockCompactLandscape(false);

    render(<NextQueue next={['I', 'O', 'T', 'S', 'Z']} palette={getPalette('default')} />);

    expect(screen.getAllByLabelText('piece-preview')).toHaveLength(5);
  });

  it('shows exactly the first three previews in compact landscape', () => {
    mockCompactLandscape(true);

    render(<NextQueue next={['I', 'O', 'T', 'S', 'Z']} palette={getPalette('default')} />);

    expect(screen.getAllByLabelText('piece-preview')).toHaveLength(3);
  });
});
