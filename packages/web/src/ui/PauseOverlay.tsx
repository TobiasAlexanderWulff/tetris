import React from 'react';

/**
 * PauseOverlay covers the game with a semi-transparent layer and basic controls.
 */
export function PauseOverlay(props: { visible: boolean; onResume?: () => void; onOpenSettings?: () => void; onOpenHelp?: () => void }): JSX.Element | null {
  if (!props.visible) return null;
  const overlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'var(--overlay-bg, rgba(0,0,0,0.7))',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--fg, #e2e8f0)',
  };
  const panel: React.CSSProperties = {
    background: 'var(--panel-bg, rgba(15,15,18,0.9))',
    padding: '16px 20px',
    borderRadius: 8,
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
    textAlign: 'center',
    minWidth: 240,
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
  return (
    <div style={overlay} aria-label="pause-overlay">
      <div style={panel} role="dialog" aria-modal="true" aria-labelledby="paused-title">
        <div id="paused-title" style={{ fontSize: 18, marginBottom: 8 }}>
          Paused
        </div>
        <div style={{ opacity: 0.9 }}>Press Escape to resume</div>
        <div style={btnCol}>
          <div
            style={btn}
            tabIndex={0}
            onClick={props.onResume}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') props.onResume?.();
            }}
            role="button"
            aria-label="resume"
          >
            Resume
          </div>
          <div
            style={{ ...btn, background: '#475569' }}
            tabIndex={0}
            onClick={props.onOpenSettings}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') props.onOpenSettings?.();
            }}
            role="button"
            aria-label="open-settings"
          >
            Settings
          </div>
          <div
            style={{ ...btn, background: '#52525b' }}
            tabIndex={0}
            onClick={props.onOpenHelp}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') props.onOpenHelp?.();
            }}
            role="button"
            aria-label="open-help"
          >
            Help
          </div>
        </div>
      </div>
    </div>
  );
}
