import React from 'react';

/**
 * GameOverOverlay shows final stats and provides a Restart action.
 */
export function GameOverOverlay({
  visible,
  score,
  level,
  lines,
  onRestart,
  onClose,
}: {
  visible: boolean;
  score: number;
  level: number;
  lines: number;
  onRestart: () => void;
  onClose?: () => void;
}): JSX.Element | null {
  if (!visible) return null;
  const overlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--fg, #e2e8f0)',
  };
  const panel: React.CSSProperties = {
    background: 'var(--panel-bg, rgba(15,15,18,0.96))',
    padding: 16,
    borderRadius: 8,
    minWidth: 320,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
  };
  const statRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 };
  const btn: React.CSSProperties = { padding: '8px 12px', background: '#334155', borderRadius: 6, cursor: 'pointer' };
  const btnRow: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="game-over">
      <div style={panel}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Game Over</div>
        <div style={statRow}>
          <div>Score</div>
          <div>{score}</div>
          <div>Level</div>
          <div>{level}</div>
          <div>Lines</div>
          <div>{lines}</div>
        </div>
        <div style={btnRow}>
          <div
            style={{ ...btn, background: '#475569' }}
            role="button"
            tabIndex={0}
            onClick={onRestart}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onRestart();
            }}
            aria-label="restart"
          >
            Restart
          </div>
          {onClose ? (
            <div
              style={btn}
              role="button"
              tabIndex={0}
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onClose();
              }}
              aria-label="close-game-over"
            >
              Close
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

