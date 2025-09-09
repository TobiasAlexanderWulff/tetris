import React from 'react';
import type { InputAction, KeyBinding } from '../input/types';
import { useSettings } from '../state/settings';
import { updateBindings } from '../input/updateBindings';

const ACTIONS: InputAction[] = [
  'Left',
  'Right',
  'RotateCW',
  'RotateCCW',
  'Rotate180',
  'SoftDrop',
  'HardDrop',
  'Hold',
];

const ACTION_LABEL: Record<InputAction, string> = {
  Left: 'Move Left',
  Right: 'Move Right',
  RotateCW: 'Rotate CW',
  RotateCCW: 'Rotate CCW',
  Rotate180: 'Rotate 180°',
  SoftDrop: 'Soft Drop',
  HardDrop: 'Hard Drop',
  Hold: 'Hold',
  Pause: 'Pause', // Not shown, but required by type
};

/**
 * ControlsPanel allows remapping keyboard bindings for gameplay actions.
 *
 * It supports an inline capture mode per action. When capturing, the next
 * keydown event assigns its KeyboardEvent.code to the selected action.
 * Conflicts are resolved by removing any existing binding that uses the
 * chosen code, ensuring global uniqueness of codes.
 */
export function ControlsPanel(): JSX.Element {
  const { settings, setSettings } = useSettings();
  const [capturing, setCapturing] = React.useState<InputAction | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const currentCodeFor = React.useCallback(
    (action: InputAction): string | null => {
      const b = settings.bindings.find((x) => x.action === action);
      return b ? b.code : null;
    },
    [settings.bindings],
  );

  const handleCapture = React.useCallback(
    (action: InputAction) => {
      setError(null);
      setCapturing(action);
      const onKey = (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.code === 'Escape') {
          cleanup();
          return;
        }
        const code = e.code;
        // Filter out meaningless codes
        if (!code || code === 'Unidentified') {
          setError('Unsupported key. Try another.');
          cleanup();
          return;
        }
        const nextBindings: KeyBinding[] = updateBindings(settings.bindings, action, code);
        setSettings({ bindings: nextBindings });
        cleanup();
      };
      const onBlur = () => cleanup();
      const cleanup = () => {
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('blur', onBlur);
        setCapturing(null);
      };
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('blur', onBlur);
    },
    [setSettings, settings.bindings],
  );

  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    alignItems: 'center',
    gap: 8,
  };
  const pill: React.CSSProperties = {
    padding: '6px 10px',
    background: '#0b1220',
    borderRadius: 999,
    minWidth: 120,
    textAlign: 'center',
    border: '1px solid #334155',
  };
  const btn: React.CSSProperties = {
    padding: '6px 10px',
    background: capturing ? '#475569' : '#334155',
    borderRadius: 6,
    cursor: 'pointer',
    border: '1px solid #475569',
  };
  const help: React.CSSProperties = { fontSize: 12, opacity: 0.8, marginTop: 6 };

  return (
    <div>
      <div style={{ fontWeight: 600, marginTop: 12, marginBottom: 6 }}>Controls</div>
      <div role="group" aria-labelledby="controls-heading">
        <div id="controls-heading" style={{ position: 'absolute', left: -9999, top: -9999 }}>
          Controls
        </div>
        <div style={grid}>
          <div style={{ opacity: 0.7 }}>Action</div>
          <div style={{ opacity: 0.7 }}>Binding</div>
          <div />
        </div>
        {ACTIONS.map((a) => (
          <div key={a} style={grid}>
            <div>{ACTION_LABEL[a]}</div>
            <div style={pill} aria-live="polite" aria-atomic="true">
              {capturing === a ? 'Press any key…' : currentCodeFor(a) ?? 'Unbound'}
            </div>
            <button
              type="button"
              style={btn}
              onClick={() => handleCapture(a)}
              aria-pressed={capturing === a}
            >
              {capturing === a ? 'Listening… (Esc to cancel)' : 'Rebind'}
            </button>
          </div>
        ))}
        {error ? <div style={{ ...help, color: '#f87171' }}>{error}</div> : null}
        <div style={help}>Press Escape to cancel capturing.</div>
      </div>
    </div>
  );
}
