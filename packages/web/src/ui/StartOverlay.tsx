import React from 'react';

/**
 * StartOverlay prompts the player to start the game.
 *
 * It displays a subtle, semi-transparent overlay with a primary action
 * to begin and supports keyboard activation (Enter/Space).
 */
export function StartOverlay({
  visible,
  onStart,
}: {
  visible: boolean;
  onStart: () => void;
}): JSX.Element | null {
  if (!visible) return null;
  const overlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.2)',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    boxSizing: 'border-box',
    color: 'var(--fg, #e2e8f0)',
  };
  const textStyle: React.CSSProperties = {
    appearance: 'none',
    background: 'transparent',
    border: 0,
    color: 'inherit',
    cursor: 'pointer',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
    fontSize: 18,
    letterSpacing: 0.5,
    minHeight: 48,
    minWidth: 48,
    opacity: 0.9,
    padding: '12px 16px',
    touchAction: 'manipulation',
  };

  return (
    <div style={overlay} aria-label="start-overlay" role="dialog" aria-modal="true">
      <button
        className="start-prompt"
        style={textStyle}
        type="button"
        aria-label="Start game"
        onClick={onStart}
      >
        Start game
      </button>
    </div>
  );
}
