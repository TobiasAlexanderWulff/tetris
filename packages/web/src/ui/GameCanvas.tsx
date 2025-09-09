import React, { useEffect, useRef } from 'react';
import { createDefaultEngine, GameHost } from '../game/GameHost';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { getPalette } from '../renderer/colors';
import { KeyboardInput } from '../input/KeyboardInput';
import { HUD } from './HUD';
import { PauseOverlay } from './PauseOverlay';
import { SettingsProvider, useSettings } from '../state/settings';
import { SettingsModal } from './SettingsModal';

// KeyboardInput is now used; no no-op input needed.

/**
 * GameCanvas mounts the game host: engine + renderer + input.
 */
export function GameCanvas(): JSX.Element {
  return (
    <SettingsProvider>
      <GameCanvasInner />
    </SettingsProvider>
  );
}

function GameCanvasInner(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<GameHost | null>(null);
  const inputRef = useRef<KeyboardInput | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [paused, setPaused] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [level, setLevel] = React.useState(0);
  const [lines, setLines] = React.useState(0);
  const [showSettings, setShowSettings] = React.useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = createDefaultEngine();
    const renderer = new CanvasRenderer(canvas, getPalette(settings.theme));
    rendererRef.current = renderer;
    const input = new KeyboardInput({ DAS: settings.das, ARR: settings.arr, allow180: settings.allow180, bindings: settings.bindings });
    inputRef.current = input;
    const host = new GameHost(canvas, engine, renderer, input);
    hostRef.current = host;
    // Initialize HUD from snapshot
    const s0 = engine.getSnapshot();
    setScore(s0.score);
    setLevel(s0.level);
    setLines(s0.linesClearedTotal);
    // Subscribe to engine events
    const unsubscribe = engine.subscribe((e) => {
      if (e.type === 'ScoreChanged') setScore(e.score);
      else if (e.type === 'LevelChanged') setLevel(e.level);
      else if (e.type === 'LinesCleared') setLines((prev) => prev + e.count);
    });
    host.start();
    return () => {
      host.dispose();
      hostRef.current = null;
      unsubscribe();
    };
  }, [settings.das, settings.arr, settings.allow180, settings.bindings, settings.theme]);

  // Apply settings changes to input and theme live
  useEffect(() => {
    inputRef.current?.updateConfig({ DAS: settings.das, ARR: settings.arr, allow180: settings.allow180, bindings: settings.bindings });
    // Theme class on body and renderer palette
    const themeClass = `theme-${settings.theme}`;
    document.body.classList.remove('theme-default', 'theme-dark', 'theme-high-contrast');
    document.body.classList.add(themeClass);
  }, [settings.das, settings.arr, settings.allow180, settings.bindings, settings.theme]);

  // Separate effect for theme -> update renderer and body class
  useEffect(() => {
    document.body.classList.remove('theme-default', 'theme-dark', 'theme-high-contrast');
    document.body.classList.add(`theme-${settings.theme}`);
    rendererRef.current?.setPalette(getPalette(settings.theme));
  }, [settings.theme]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === 'Escape') {
        setPaused((p) => {
          const next = !p;
          hostRef.current?.setPaused(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <HUD score={score} level={level} lines={lines} />
      <PauseOverlay
        visible={paused}
        onOpenSettings={() => setShowSettings(true)}
        onResume={() => {
          setPaused(false);
          hostRef.current?.setPaused(false);
        }}
      />
      {showSettings ? <SettingsModal onClose={() => setShowSettings(false)} /> : null}
    </div>
  );
}
