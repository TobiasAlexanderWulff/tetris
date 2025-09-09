/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HelpModal } from './HelpModal';

describe('HelpModal', () => {
  it('renders controls and can close', () => {
    const onClose = () => {};
    render(<HelpModal onClose={onClose} />);
    expect(screen.getByLabelText('help')).toBeTruthy();
    expect(screen.getByText('Controls')).toBeTruthy();
    expect(screen.getByText('Scoring Basics')).toBeTruthy();
  });
});

