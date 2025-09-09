import React from 'react';

/**
 * HUD displays core gameplay metrics: score, level, and total lines.
 * It is designed to be lightweight and update from parent state.
 */
export function HUD(props: { score: number; level: number; lines: number }): JSX.Element {
  const { score, level, lines } = props;
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '8px 10px',
    background: 'rgba(15,15,18,0.6)',
    color: '#e2e8f0',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 14,
    borderRadius: 6,
    lineHeight: 1.4,
  };
  const row: React.CSSProperties = { display: 'flex', gap: 8 };
  const label: React.CSSProperties = { opacity: 0.8 };

  return (
    <div style={boxStyle} aria-label="hud">
      <div style={row}>
        <span style={label}>Score:</span>
        <span>{score}</span>
      </div>
      <div style={row}>
        <span style={label}>Level:</span>
        <span>{level}</span>
      </div>
      <div style={row}>
        <span style={label}>Lines:</span>
        <span>{lines}</span>
      </div>
    </div>
  );
}

