import React from 'react';

/**
 * HelpModal shows controls and gameplay basics. Accessible and keyboard-friendly.
 */
export function HelpModal({ onClose }: { onClose: () => void }): JSX.Element {
  const overlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--fg, #e2e8f0)',
  };
  const panel: React.CSSProperties = {
    background: 'var(--panel-bg, rgba(15,15,18,0.96))',
    padding: 16,
    borderRadius: 8,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
    minWidth: 360,
    maxWidth: 640,
  };
  const h: React.CSSProperties = { margin: '6px 0', fontWeight: 600, fontSize: 14 };
  const dl: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 6 };
  const btnRow: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' };
  const btn: React.CSSProperties = { padding: '8px 12px', background: '#334155', borderRadius: 6, cursor: 'pointer' };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="help">
      <div style={panel}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Help</div>
        <div style={h}>Controls</div>
        <div style={dl}>
          <div>Move</div>
          <div>Arrow Left / Arrow Right</div>
          <div>Rotate</div>
          <div>Arrow Up (CW), Z (CCW), X (CW), 180° if enabled</div>
          <div>Soft Drop</div>
          <div>Arrow Down (faster fall)</div>
          <div>Hard Drop</div>
          <div>Space (instant drop + lock)</div>
          <div>Hold</div>
          <div>Shift (swap with hold piece)</div>
          <div>Pause</div>
          <div>Escape (open Pause/Settings/Help)</div>
        </div>
        <div style={h}>Scoring Basics</div>
        <div>
          Single = 100, Double = 300, Triple = 500, Tetris = 800. Drop bonuses: soft +1/cell, hard +2/cell.
          Back-to-Back multiplies Tetris. Combos add incremental bonuses.
        </div>
        <div style={h}>Tips</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Use Hold to save key pieces (e.g., I for Tetris).</li>
          <li>Soft drop to adjust placement; hard drop to commit quickly.</li>
          <li>Change DAS/ARR and theme in Settings for comfort and visibility.</li>
        </ul>
        <div style={btnRow}>
          <div
            style={btn}
            onClick={onClose}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
            aria-label="close-help"
          >
            Close
          </div>
        </div>
      </div>
    </div>
  );
}

