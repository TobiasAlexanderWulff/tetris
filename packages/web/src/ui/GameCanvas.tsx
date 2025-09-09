import React, { useEffect, useRef } from 'react';
import { createDefaultEngine, GameHost } from '../game/GameHost';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { getPalette } from '../renderer/colors';
import { KeyboardInput } from '../input/KeyboardInput';
import { HUD } from './HUD';
import { PauseOverlay } from './PauseOverlay';
import { SettingsProvider, useSettings } from '../state/settings';
import { SettingsModal } from './SettingsModal';
import { HelpModal } from './HelpModal';
import { StatusToasts, type Toast } from './StatusToasts';
import { NextQueue } from './NextQueue';
import { HoldBox } from './HoldBox';

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
  const engineRef = useRef<ReturnType<typeof createDefaultEngine> | null>(null);
  const [paused, setPaused] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [level, setLevel] = React.useState(0);
  const [lines, setLines] = React.useState(0);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const { toasts, addToast } = useToastManager();
  const { settings } = useSettings();
  const palette = React.useMemo(() => getPalette(settings.theme), [settings.theme]);
  const [nextIds, setNextIds] = React.useState<readonly import('@tetris/core').TetrominoId[]>([]);
  const [holdId, setHoldId] = React.useState<import('@tetris/core').TetrominoId | null>(null);
  const [canHold, setCanHold] = React.useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = createDefaultEngine();
    engineRef.current = engine;
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
      else if (e.type === 'LinesCleared') {
        setLines((prev) => prev + e.count);
        if (settings.animations) {
          const msgs: string[] = [];
          if (e.count === 4) msgs.push(e.b2b ? 'Back-to-Back TETRIS!' : 'TETRIS!');
          else if (e.count === 3) msgs.push('Triple');
          else if (e.count === 2) msgs.push('Double');
          else if (e.count === 1) msgs.push('Single');
          if (typeof e.combo === 'number' && e.combo > 0) msgs.push(`Combo x${e.combo + 1}`);
          for (const m of msgs) addToast(m);
        }
      }
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

  // Poll preview state from snapshot each animation frame (small data)
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const e = engineRef.current;
      if (e) {
        const s = e.getSnapshot();
        setNextIds(s.next);
        setHoldId(s.hold);
        setCanHold(s.canHold);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
      <NextQueue next={nextIds} palette={palette} />
      <HoldBox hold={holdId} canHold={canHold} palette={palette} />
      <StatusToasts toasts={toasts} />
      <PauseOverlay
        visible={paused}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHelp={() => setShowHelp(true)}
        onResume={() => {
          setPaused(false);
          hostRef.current?.setPaused(false);
        }}
      />
      {showSettings ? <SettingsModal onClose={() => setShowSettings(false)} /> : null}
      {showHelp ? <HelpModal onClose={() => setShowHelp(false)} /> : null}
    </div>
  );
}

function useToastManager() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const addToast = (text: string) => {
    const id = Date.now() + Math.random();
    const t: Toast = { id, text };
    setToasts((prev) => [...prev, t]);
    // Remove after 1.8s
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 1800);
  };
  return { toasts, addToast, setToasts };
}
