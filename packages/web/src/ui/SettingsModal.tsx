import React from 'react';
import { useSettings } from '../state/settings';
import { exportHighscores, importHighscores, clearHighscores } from '../highscore';
import { ControlsPanel } from './ControlsPanel';

export function SettingsModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { settings, setSettings } = useSettings();
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
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
    minWidth: 300,
  };
  const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 };
  const btnRow: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' };
  const section: React.CSSProperties = { marginTop: 16 };
  const input: React.CSSProperties = { padding: '6px 8px', background: '#0b1220', borderRadius: 6, color: 'var(--fg, #e2e8f0)' };
  const btn: React.CSSProperties = { padding: '8px 12px', background: '#334155', borderRadius: 6, cursor: 'pointer' };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="settings">
      <div style={panel}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Settings</div>
        <ControlsPanel />
        {/* Mouse controls */}
        <div style={{ ...row, gridTemplateColumns: 'auto 1fr' }}>
          <label htmlFor="mouseControls">Enable Mouse Controls</label>
          <input
            id="mouseControls"
            type="checkbox"
            checked={settings.mouseControls}
            onChange={(e) => setSettings({ mouseControls: e.target.checked })}
          />
        </div>
        {settings.mouseControls ? (
          <>
            <div style={{ ...row, gridTemplateColumns: 'auto 1fr' }}>
              <label htmlFor="mouseAutoSens">Auto Mouse Sensitivity</label>
              <input
                id="mouseAutoSens"
                type="checkbox"
                checked={settings.mouseSensitivityPxPerCell === 'auto'}
                onChange={(e) =>
                  setSettings({
                    mouseSensitivityPxPerCell: e.target.checked
                      ? 'auto'
                      : Math.max(8, typeof settings.mouseSensitivityPxPerCell === 'number' ? settings.mouseSensitivityPxPerCell : 24),
                  })
                }
              />
            </div>
            {settings.mouseSensitivityPxPerCell !== 'auto' ? (
              <div style={row}>
                <label htmlFor="mouseSens">Mouse Sensitivity (px/cell)</label>
                <input
                  id="mouseSens"
                  style={input}
                  type="number"
                  min={4}
                  max={128}
                  step={1}
                  value={typeof settings.mouseSensitivityPxPerCell === 'number' ? settings.mouseSensitivityPxPerCell : 24}
                  onChange={(e) =>
                    setSettings({ mouseSensitivityPxPerCell: clampInt(e.target.value, 4, 128) })
                  }
                />
              </div>
            ) : null}
          </>
        ) : null}
        <div style={row}>
          <label htmlFor="das">DAS (ms)</label>
          <input
            id="das"
            style={input}
            type="number"
            min={0}
            step={1}
            value={settings.das}
            onChange={(e) => setSettings({ das: clampInt(e.target.value, 0, 1000) })}
          />
        </div>
        <div style={{ ...row, gridTemplateColumns: 'auto 1fr' }}>
          <label htmlFor="animations">Animations (Juice)</label>
          <input
            id="animations"
            type="checkbox"
            checked={settings.animations}
            onChange={(e) => setSettings({ animations: e.target.checked })}
          />
        </div>
        <div style={row}>
          <label htmlFor="arr">ARR (ms)</label>
          <input
            id="arr"
            style={input}
            type="number"
            min={0}
            step={1}
            value={settings.arr}
            onChange={(e) => setSettings({ arr: clampInt(e.target.value, 0, 1000) })}
          />
        </div>
        <div style={row}>
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            style={input}
            value={settings.theme}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSettings({
                theme: e.target.value as 'default' | 'dark' | 'high-contrast' | 'color-blind',
              })
            }
          >
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="high-contrast">High Contrast</option>
            <option value="color-blind">Color‑blind Friendly</option>
          </select>
        </div>
        <div style={{ ...row, gridTemplateColumns: 'auto 1fr' }}>
          <label htmlFor="allow180">Allow 180° Rotation</label>
          <input
            id="allow180"
            type="checkbox"
            checked={settings.allow180}
            onChange={(e) => setSettings({ allow180: e.target.checked })}
          />
        </div>
        <div style={row}>
          <label htmlFor="master">Master Volume</label>
          <input
            id="master"
            style={{ width: '100%' }}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.audio.master}
            onChange={(e) => setSettings({ audio: { ...settings.audio, master: Number(e.target.value) } })}
          />
        </div>
        <div style={{ ...row, gridTemplateColumns: 'auto 1fr' }}>
          <label htmlFor="mute">Mute All</label>
          <input
            id="mute"
            type="checkbox"
            checked={settings.audio.muted}
            onChange={(e) => setSettings({ audio: { ...settings.audio, muted: e.target.checked } })}
          />
        </div>
        <div style={section}>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Highscores</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              style={btn}
              aria-label="export-highscores"
              onClick={() => {
                try {
                  const data = exportHighscores();
                  void navigator.clipboard?.writeText?.(data);
                  alert('Highscores copied to clipboard as JSON.');
                } catch (e) {
                  alert('Failed to export highscores.');
                }
              }}
            >
              Export (copy)
            </button>
            <button
              style={btn}
              aria-label="import-highscores"
              onClick={() => {
                const json = prompt('Paste highscores JSON to import:');
                if (!json) return;
                const strategy = confirm('OK = Merge, Cancel = Replace') ? 'merge' : 'replace';
                const res = importHighscores(json, strategy);
                alert(res.ok ? `Imported ${res.imported} entries.` : 'Import failed.');
              }}
            >
              Import
            </button>
            <button
              style={{ ...btn, background: '#7f1d1d' }}
              aria-label="clear-highscores"
              onClick={() => {
                if (confirm('Clear all highscores? This cannot be undone.')) clearHighscores();
              }}
            >
              Clear All
            </button>
          </div>
        </div>

        <div style={btnRow}>
          <div
            style={btn}
            onClick={onClose}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
          >
            Close
          </div>
        </div>
      </div>
    </div>
  );
}

function clampInt(val: string, min: number, max: number): number {
  const n = Math.floor(Number(val));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
