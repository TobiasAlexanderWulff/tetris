import React from 'react';
import type { HighscoreEntry } from '../highscore';
import { HighscoreTable } from './HighscoreTable';

/**
 * GameOverOverlay shows final stats and provides a Restart action.
 */
export function GameOverOverlay({
  visible,
  score,
  level,
  lines,
  newHigh,
  rank,
  top,
  onRestart,
  onClose,
}: {
  visible: boolean;
  score: number;
  level: number;
  lines: number;
  newHigh?: boolean;
  rank?: number;
  top?: HighscoreEntry[];
  onRestart: () => void;
  onClose?: () => void;
}): JSX.Element | null {
  if (!visible) return null;
  const overlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'var(--overlay-bg, rgba(0,0,0,0.7))',
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
  const banner: React.CSSProperties = {
    background: '#14532d',
    color: '#ecfdf5',
    borderRadius: 6,
    padding: '6px 8px',
    margin: '8px 0',
    fontWeight: 600,
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="game-over">
      <div style={panel}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Game Over</div>
        {newHigh ? (
          <div style={{ marginBottom: 8, color: '#22c55e' }}>
            New Highscore{typeof rank === 'number' ? ` — Rank #${rank}` : ''}!
          </div>
        ) : null}
        <div style={statRow}>
          <div>Score</div>
          <div>{score}</div>
          <div>Level</div>
          <div>{level}</div>
          <div>Lines</div>
          <div>{lines}</div>
        </div>
        {top && top.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Top Scores</div>
            <div style={{ display: 'grid', gap: 2 }}>
              {top.slice(0, 5).map((e, i) => (
                <div key={e.id} style={{ display: 'flex', gap: 8, fontSize: 12, opacity: 0.9 }}>
                  <div style={{ width: 18, textAlign: 'right' }}>{i + 1}.</div>
                  <div>Score: {e.score}</div>
                  <div>Level: {e.level}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {newHigh ? (
          <div style={banner} aria-label="new-highscore">New High Score{typeof rank === 'number' ? ` — #${rank}` : ''}!</div>
        ) : null}

        {top && top.length ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>Top Highscores</div>
            <HighscoreTable entries={top} max={10} />
          </div>
        ) : null}

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
