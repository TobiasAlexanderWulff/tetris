import React from 'react';

export type Toast = { id: number; text: string; kind?: 'info' | 'success' };

/**
 * StatusToasts renders transient messages (e.g., B2B, Combo, Tetris).
 */
export function StatusToasts({ toasts }: { toasts: Toast[] }): JSX.Element {
  const wrap: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'none',
  };
  const item: React.CSSProperties = {
    background: 'var(--panel-bg, rgba(15,15,18,0.6))',
    color: 'var(--fg, #e2e8f0)',
    padding: '6px 10px',
    borderRadius: 8,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 14,
    animation: 'toast-in-out 1800ms ease both',
  };
  return (
    <div style={wrap} aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} style={item} role="status">
          {t.text}
        </div>
      ))}
    </div>
  );
}

