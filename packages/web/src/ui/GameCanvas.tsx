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
import { GameOverOverlay } from './GameOverOverlay';

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
  const [gameOver, setGameOver] = React.useState(false);
  const [instanceId, setInstanceId] = React.useState(0);
  const { toasts, addToast } = useToastManager();
  const { settings } = useSettings();
  const palette = React.useMemo(() => getPalette(settings.theme), [settings.theme]);
  const [nextIds, setNextIds] = React.useState<readonly import('@tetris/core').TetrominoId[]>([]);
  const [holdId, setHoldId] = React.useState<import('@tetris/core').TetrominoId | null>(null);
  const [canHold, setCanHold] = React.useState(true);
  const animationsRef = React.useRef(settings.animations);
  React.useEffect(() => {
    animationsRef.current = settings.animations;
  }, [settings.animations]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = createDefaultEngine({ allow180: settings.allow180 });
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
        if (animationsRef.current) {
          const msgs: string[] = [];
          if (e.count === 4) msgs.push(e.b2b ? 'Back-to-Back TETRIS!' : 'TETRIS!');
          else if (e.count === 3) msgs.push('Triple');
          else if (e.count === 2) msgs.push('Double');
          else if (e.count === 1) msgs.push('Single');
          if (typeof e.combo === 'number' && e.combo > 0) msgs.push(`Combo x${e.combo + 1}`);
          for (const m of msgs) addToast(m);
        }
      }
      else if (e.type === 'GameOver') {
        setGameOver(true);
        setPaused(true);
        host.setPaused(true);
      }
    });
    host.start();
    return () => {
      host.dispose();
      hostRef.current = null;
      unsubscribe();
    };
  }, [addToast, instanceId]);

  // Apply settings changes to input live (no restart)
  useEffect(() => {
    inputRef.current?.updateConfig({
      DAS: settings.das,
      ARR: settings.arr,
      allow180: settings.allow180,
      bindings: settings.bindings,
    });
  }, [settings.das, settings.arr, settings.allow180, settings.bindings]);

  // Theme -> update renderer and body class without recreating host
  useEffect(() => {
    document.body.classList.remove(
      'theme-default',
      'theme-dark',
      'theme-high-contrast',
      'theme-color-blind',
    );
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
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
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
      <GameOverOverlay
        visible={gameOver}
        score={score}
        level={level}
        lines={lines}
        onRestart={() => {
          hostRef.current?.dispose();
          hostRef.current = null;
          setScore(0);
          setLevel(0);
          setLines(0);
          setNextIds([]);
          setHoldId(null);
          setCanHold(true);
          setGameOver(false);
          setPaused(false);
          setInstanceId((n) => n + 1);
        }}
      />
    </div>
  );
}

function useToastManager() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const addToast = React.useCallback((text: string) => {
    const id = Date.now() + Math.random();
    const t: Toast = { id, text };
    setToasts((prev) => [...prev, t]);
    // Remove after 1.8s
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 1800);
  }, []);
  return { toasts, addToast, setToasts };
}
