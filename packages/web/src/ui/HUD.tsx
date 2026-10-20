import React from 'react';

/**
 * HUD displays core gameplay metrics: score, level, and total lines.
 * It is designed to be lightweight and update from parent state.
 */
export function HUD(props: {
  score: number;
  level: number;
  lines: number;
  pb?: number;
}): JSX.Element {
  const { score, level, lines, pb } = props;
  const boxStyle: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  };
  const row: React.CSSProperties = { display: 'flex', gap: 8 };
  const label: React.CSSProperties = { opacity: 0.8 };

  return (
    <div className="hud-panel" style={boxStyle} aria-label="hud">
      {typeof pb === 'number' ? (
        <div style={row}>
          <span style={label}>Highscore:</span>
          <span>{pb}</span>
        </div>
      ) : null}
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
