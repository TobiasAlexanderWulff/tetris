import React from 'react';

/**
 * StartOverlay prompts the player to start the game.
 *
 * It displays a subtle, semi-transparent overlay with a primary action
 * to begin and supports keyboard activation (Enter/Space).
 */
export function StartOverlay({ visible }: { visible: boolean }): JSX.Element | null {
  if (!visible) return null;
  const overlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.2)',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--fg, #e2e8f0)',
    pointerEvents: 'none',
  };
  const textStyle: React.CSSProperties = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
    fontSize: 18,
    letterSpacing: 0.5,
    opacity: 0.9,
  };

  return (
    <div style={overlay} aria-label="start-overlay" role="dialog" aria-modal="true">
      <div className="start-prompt" style={textStyle}>press to start</div>
    </div>
  );
}
