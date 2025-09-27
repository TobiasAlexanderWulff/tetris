import React from 'react';

/**
 * MenuButton renders a floating action control that toggles the pause menu.
 *
 * The button matches the translucent panel styling used across overlays and
 * exposes an active state so callers can indicate when the menu is open.
 */
export function MenuButton(props: {
  open: boolean;
  onToggle?: () => void;
}): JSX.Element {
  const { open, onToggle } = props;
  const container: React.CSSProperties = {
    position: 'relative',
    pointerEvents: 'auto',
  };
  const button: React.CSSProperties = {
    appearance: 'none',
    border: '1px solid #475569',
    background: open ? '#475569' : '#334155',
    color: 'var(--fg, #e2e8f0)',
    padding: '8px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
    letterSpacing: 0.4,
    fontWeight: 600,
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(15,23,42,0.35)',
    transition: 'background 120ms ease, transform 120ms ease',
  };
  const icon: React.CSSProperties = {
    width: 18,
    height: 12,
    display: 'grid',
    gap: 3,
  };
  const bar: React.CSSProperties = {
    width: '100%',
    height: 2,
    borderRadius: 2,
    background: 'currentColor',
    opacity: open ? 1 : 0.9,
  };

  return (
    <div style={container}>
      <button
        type="button"
        style={button}
        onClick={onToggle}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        aria-pressed={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        <span aria-hidden="true" style={icon}>
          <span style={bar} />
          <span style={bar} />
          <span style={bar} />
        </span>
        <span>Menu</span>
      </button>
    </div>
  );
}
