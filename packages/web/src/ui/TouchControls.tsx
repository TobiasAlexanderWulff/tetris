import React from 'react';
import type { TouchButtonAction } from '../input/TouchInput';

/** Props for the mobile gameplay action strip. */
export interface TouchControlsProps {
  allow180: boolean;
  disabled: boolean;
  onAction: (action: TouchButtonAction) => void;
}

const ACTIONS: readonly {
  action: TouchButtonAction;
  label: string;
  text: string;
}[] = [
  { action: 'Hold', label: 'Hold', text: 'HOLD' },
  {
    action: 'RotateCCW',
    label: 'Rotate counterclockwise',
    text: '↶',
  },
  { action: 'RotateCW', label: 'Rotate clockwise', text: '↷' },
  { action: 'Rotate180', label: 'Rotate 180 degrees', text: '180°' },
  { action: 'HardDrop', label: 'Hard drop', text: 'DROP' },
];

/**
 * Renders semantic, thumb-sized buttons for non-drag touch actions.
 */
export function TouchControls({ allow180, disabled, onAction }: TouchControlsProps): JSX.Element {
  const actions = allow180 ? ACTIONS : ACTIONS.filter(({ action }) => action !== 'Rotate180');

  return (
    <div
      className={`touch-controls${allow180 ? ' touch-controls--with-180' : ''}`}
      aria-label="Touch controls"
    >
      {actions.map(({ action, label, text }) => (
        <button
          className={`touch-control-button touch-control-button--${action.toLowerCase()}`}
          key={action}
          type="button"
          disabled={disabled}
          aria-label={label}
          onClick={() => onAction(action)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
