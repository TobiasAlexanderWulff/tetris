import React from 'react';
import type { HighscoreEntry } from '../highscore';

/**
 * HighscoreTable: displays a compact, accessible table of highscores.
 */
export function HighscoreTable({ entries, max = 10 }: { entries: HighscoreEntry[]; max?: number }): JSX.Element {
  const list = (entries || []).slice(0, Math.max(0, Math.floor(max)));
  const table: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 8,
    fontSize: 13,
  };
  const thtd: React.CSSProperties = { padding: '6px 8px', textAlign: 'left' };
  const header: React.CSSProperties = { ...thtd, opacity: 0.8 };
  const rowStyle: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.08)' };

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };
  const fmtDate = (ts: number) => {
    const d = new Date(ts || 0);
    if (!Number.isFinite(d.getTime())) return '-';
    return d.toLocaleDateString();
  };

  return (
    <table role="table" style={table} aria-label="highscore-table">
      <thead>
        <tr>
          <th style={header}>#</th>
          <th style={header}>Score</th>
          <th style={header}>Lines</th>
          <th style={header}>Level</th>
          <th style={header}>Time</th>
          <th style={header}>Date</th>
        </tr>
      </thead>
      <tbody>
        {list.length === 0 ? (
          <tr style={rowStyle}>
            <td style={thtd} colSpan={6} aria-label="empty-highscores">No highscores yet</td>
          </tr>
        ) : (
          list.map((e, i) => (
            <tr key={e.id} style={rowStyle}>
              <td style={thtd}>{i + 1}</td>
              <td style={thtd}>{e.score}</td>
              <td style={thtd}>{e.lines}</td>
              <td style={thtd}>{e.level}</td>
              <td style={thtd}>{fmtTime(e.durationMs)}</td>
              <td style={thtd}>{fmtDate(e.timestamp)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

