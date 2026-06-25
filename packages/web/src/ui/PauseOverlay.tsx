import React from 'react';

/**
 * PauseOverlay covers the game with a semi-transparent layer and basic controls.
 * The panel height is constrained for small viewports with scrollable content
 * so that actions remain visible.
 */
export function PauseOverlay(props: {
  visible: boolean;
  onResume?: () => void;
  onRestart: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}): JSX.Element | null {
  if (!props.visible) return null;
  const overlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'var(--overlay-bg, rgba(0,0,0,0.7))',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    boxSizing: 'border-box',
    color: 'var(--fg, #e2e8f0)',
  };
  const panel: React.CSSProperties = {
    background: 'var(--panel-bg, rgba(15,15,18,0.9))',
    padding: '16px 20px',
    borderRadius: 8,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
    textAlign: 'center',
    minWidth: 0,
    width: 'min(92vw, 480px)',
    boxSizing: 'border-box',
    maxHeight: 'calc(100dvh - 32px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };
  const btnCol: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 12,
    alignItems: 'center',
  };
  const btn: React.CSSProperties = {
    marginTop: 0,
    padding: '8px 12px',
    background: '#334155',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'inline-block',
  };
  const content: React.CSSProperties = { flex: '1 1 auto', minHeight: 0, overflowY: 'auto' };
  return (
    <div style={overlay} aria-label="pause-overlay">
      <div style={panel} role="dialog" aria-modal="true" aria-labelledby="paused-title">
        <div id="paused-title" style={{ fontSize: 18, marginBottom: 8 }}>
          Paused
        </div>
        <div style={content} aria-label="pause-content">
          <div style={{ opacity: 0.9 }}>Press Escape to resume</div>
          <div style={btnCol}>
            <button
              type="button"
              className="overlay-action"
              style={btn}
              onClick={props.onResume}
              aria-label="resume"
            >
              Resume
            </button>
            <button
              type="button"
              className="overlay-action"
              style={{ ...btn, background: '#7c2d12' }}
              onClick={props.onRestart}
              aria-label="restart"
            >
              Restart
            </button>
            <button
              type="button"
              className="overlay-action"
              style={{ ...btn, background: '#475569' }}
              onClick={props.onOpenSettings}
              aria-label="open-settings"
            >
              Settings
            </button>
            <button
              type="button"
              className="overlay-action"
              style={{ ...btn, background: '#52525b' }}
              onClick={props.onOpenHelp}
              aria-label="open-help"
            >
              Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
