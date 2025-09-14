import React, { useEffect, useRef } from 'react';
import { createDefaultEngine, GameHost } from '../game/GameHost';
import { TETROMINO_SHAPES } from '@tetris/core';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { getPalette } from '../renderer/colors';
import { KeyboardInput } from '../input/KeyboardInput';
import { MouseInput } from '../input/MouseInput';
import { MultiInput } from '../input/MultiInput';
import { HUD } from './HUD';
import { PauseOverlay } from './PauseOverlay';
import { SettingsProvider, useSettings } from '../state/settings';
import { AudioProvider } from '../audio/AudioProvider';
import { SettingsModal } from './SettingsModal';
import { HelpModal } from './HelpModal';
import { StatusToasts, type Toast } from './StatusToasts';
import { NextQueue } from './NextQueue';
import { HoldBox } from './HoldBox';
import { GameOverOverlay } from './GameOverOverlay';
import { StartOverlay } from './StartOverlay';
import { EffectScheduler } from '../effects/Effects';
import { initHighscores, maybeSubmit, getHighscores } from '../highscore';
import { useAudio } from '../audio/AudioProvider';
import { audioEventHandler } from '../audio/events';

// KeyboardInput is now used; no no-op input needed.

/**
 * GameCanvas mounts the game host: engine + renderer + input.
 */
export function GameCanvas(): JSX.Element {
  return (
    <SettingsProvider>
      <AudioProvider>
        <GameCanvasInner />
      </AudioProvider>
    </SettingsProvider>
  );
}

function GameCanvasInner(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<GameHost | null>(null);
  const kbRef = useRef<KeyboardInput | null>(null);
  const mouseRef = useRef<MouseInput | null>(null);
  const multiRef = useRef<MultiInput | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const engineRef = useRef<ReturnType<typeof createDefaultEngine> | null>(null);
  const effectsRef = useRef<EffectScheduler | null>(null);
  const [paused, setPaused] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [level, setLevel] = React.useState(0);
  const [lines, setLines] = React.useState(0);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [gameOver, setGameOver] = React.useState(false);
  const [newHigh, setNewHigh] = React.useState(false);
  const [highRank, setHighRank] = React.useState<number | undefined>(undefined);
  const [topHighscores, setTopHighscores] = React.useState<import('../highscore').HighscoreEntry[]>([]);
  const [pb, setPb] = React.useState<number | undefined>(undefined);
  const [instanceId, setInstanceId] = React.useState(0);
  const [started, setStarted] = React.useState(false);
  const { toasts, addToast } = useToastManager();
  const { settings } = useSettings();
  const palette = React.useMemo(() => getPalette(settings.theme), [settings.theme]);
  const [nextIds, setNextIds] = React.useState<readonly import('@tetris/core').TetrominoId[]>([]);
  const [holdId, setHoldId] = React.useState<import('@tetris/core').TetrominoId | null>(null);
  const [canHold, setCanHold] = React.useState(true);
  const audio = useAudio();
  // Refs to avoid stale closure inside host effect
  const scoreRef = React.useRef(0);
  const levelRef = React.useRef(0);
  const linesRef = React.useRef(0);
  const animationsRef = React.useRef(settings.animations);
  React.useEffect(() => {
    animationsRef.current = settings.animations;
  }, [settings.animations]);
  // Track reduced motion and mobile to gate optional particles
  const reducedMotion = React.useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);
  const isMobile = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);
  // Refs for initial boot values to satisfy hooks lint and avoid resets
  const initAllow180Ref = React.useRef(settings.allow180);
  const initThemeRef = React.useRef(settings.theme);
  const initDasRef = React.useRef(settings.das);
  const initArrRef = React.useRef(settings.arr);
  const initBindingsRef = React.useRef(settings.bindings);
  const initMouseControlsRef = React.useRef(settings.mouseControls);
  const initMouseSensitivityRef = React.useRef(settings.mouseSensitivityPxPerCell);
  React.useEffect(() => {
    initAllow180Ref.current = settings.allow180;
  }, [settings.allow180]);
  React.useEffect(() => {
    initThemeRef.current = settings.theme;
  }, [settings.theme]);
  React.useEffect(() => {
    initDasRef.current = settings.das;
  }, [settings.das]);
  React.useEffect(() => {
    initArrRef.current = settings.arr;
  }, [settings.arr]);
  React.useEffect(() => {
    initBindingsRef.current = settings.bindings;
  }, [settings.bindings]);
  React.useEffect(() => {
    initMouseControlsRef.current = settings.mouseControls;
  }, [settings.mouseControls]);
  React.useEffect(() => {
    initMouseSensitivityRef.current = settings.mouseSensitivityPxPerCell;
  }, [settings.mouseSensitivityPxPerCell]);

  // Initialize highscores storage once
  useEffect(() => {
    initHighscores();
  }, []);

  const startTimeRef = useRef<number>(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = createDefaultEngine({ allow180: initAllow180Ref.current });
    engineRef.current = engine;
    const renderer = new CanvasRenderer(canvas, getPalette(initThemeRef.current));
    rendererRef.current = renderer;
    // Effects setup
    const effects = new EffectScheduler();
    effects.setEnabled(animationsRef.current);
    effects.setAllowParticles(!isMobile && !reducedMotion);
    effectsRef.current = effects;
    renderer.setEffects(effects);
    const kb = new KeyboardInput({
      DAS: initDasRef.current,
      ARR: initArrRef.current,
      allow180: initAllow180Ref.current,
      bindings: initBindingsRef.current,
    });
    kbRef.current = kb;
    const mouse = new MouseInput({
      enabled: initMouseControlsRef.current,
      allow180: initAllow180Ref.current,
      sensitivityPxPerCell:
        initMouseSensitivityRef.current === 'auto' ? undefined : (initMouseSensitivityRef.current as number),
    });
    // Set bounds element so MouseInput knows the canvas rect
    mouse.setBoundsElement(canvas);
    // Enable/disable and sensitivity based on current settings
    // no-op: Mouse already initialized with settings above
    mouseRef.current = mouse;
    const multi = new MultiInput([kb, mouse]);
    multiRef.current = multi;
    const host = new GameHost(canvas, engine, renderer, multi);
    hostRef.current = host;
    // Initialize HUD from snapshot
    const s0 = engine.getSnapshot();
    setScore(s0.score);
    setLevel(s0.level);
    setLines(s0.linesClearedTotal);
    // Subscribe to engine events once, and fan out to audio + UI handlers
    const onAudioEvent = audioEventHandler(audio);
    const unsubscribe = engine.subscribe((e) => {
      onAudioEvent(e);
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
        // Trigger line-flash (and optional particles) via effects
        effectsRef.current?.onLinesCleared(e.rows, performance.now());
      }
      else if (e.type === 'PieceSpawned') {
        // Read snapshot to know spawn position/rotation
        const s = engine.getSnapshot();
        if (s.active) {
          effectsRef.current?.onPieceSpawned(s.active.id, s.active.position, s.active.rotation, performance.now());
          // Arm mouse start-drag threshold: 1 cell + half piece width (in cells)
          const w = pieceWidthCells(s.active.id, s.active.rotation);
          mouseRef.current?.armStartDragThresholdForPiece(w);
        }
      }
      else if (e.type === 'PieceRotated') {
        const s = engine.getSnapshot();
        if (s.active) {
          const w = pieceWidthCells(s.active.id, s.active.rotation);
          mouseRef.current?.armStartDragThresholdForPiece(w);
        }
      }
      else if (e.type === 'GameOver') {
        setGameOver(true);
        setPaused(true);
        host.setPaused(true);
        // Crossfade back to menu music on game over
        try { audio.crossfade('menu_ambient', 0.6); } catch { /* ignore in tests */ }
        if (!submittedRef.current) {
          submittedRef.current = true;
          const duration = Math.max(0, Math.floor(performance.now() - startTimeRef.current));
          const res = maybeSubmit({
            score: scoreRef.current,
            lines: linesRef.current,
            level: levelRef.current,
            durationMs: duration,
            mode: 'marathon',
          });
          setNewHigh(!!res.added);
          setHighRank(res.rank);
          try {
            const top = getHighscores('marathon');
            setTopHighscores(top);
            setPb(top[0]?.score);
          } catch {
            setTopHighscores([]);
          }
        }
      }
    });
    host.start();
    // Start paused until user input (overlay visible)
    host.setPaused(true);
    setStarted(false);
    submittedRef.current = false;
    // Menu music now handled by AudioProvider after user gesture
    // Load current PB for the mode at start
    try {
      const top = getHighscores('marathon');
      setPb(top[0]?.score);
    } catch {
      setPb(undefined);
    }
    return () => {
      host.dispose();
      hostRef.current = null;
      renderer.setEffects(null);
      effectsRef.current = null;
      unsubscribe();
    };
  }, [addToast, instanceId, isMobile, reducedMotion, audio]);

  // Apply settings changes to input live (no restart)
  useEffect(() => {
    kbRef.current?.updateConfig({
      DAS: settings.das,
      ARR: settings.arr,
      allow180: settings.allow180,
      bindings: settings.bindings,
    });
    mouseRef.current?.updateConfig({
      allow180: settings.allow180,
      enabled: settings.mouseControls,
      sensitivityPxPerCell:
        settings.mouseSensitivityPxPerCell === 'auto' ? undefined : settings.mouseSensitivityPxPerCell,
    });
  }, [settings.das, settings.arr, settings.allow180, settings.bindings, settings.mouseControls, settings.mouseSensitivityPxPerCell]);

  // Update effects enablement when animations toggle changes
  useEffect(() => {
    effectsRef.current?.setEnabled(settings.animations);
  }, [settings.animations]);

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

  // Keep refs in sync to satisfy hooks lint without restarting host effect
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      // Before start: any key starts the game
      if (!started) {
        ev.preventDefault();
        setStarted(true);
        hostRef.current?.setPaused(false);
        startTimeRef.current = performance.now();
        // Crossfade to gameplay theme
        try { audio.crossfade('theme_main', 0.8); } catch { /* ignore in tests */ }
        return;
      }
      if (ev.code === 'Escape') {
        setPaused((p) => {
          const next = !p;
          hostRef.current?.setPaused(next);
          return next;
        });
      }
    };
    const onPointer = () => {
      if (!started) {
        setStarted(true);
        hostRef.current?.setPaused(false);
        startTimeRef.current = performance.now();
        try { audio.crossfade('theme_main', 0.8); } catch { /* ignore in tests */ }
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [started, audio]);

  // React to pause toggles: crossfade to menu when paused; back to theme when resuming.
  useEffect(() => {
    if (!started) return; // handled by start effect
    try {
      if (paused) audio.crossfade('menu_ambient', 0.6);
      else audio.crossfade('theme_main', 0.6);
    } catch { /* ignore in tests */ }
  }, [paused, started, audio]);

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
      <HUD score={score} level={level} lines={lines} pb={pb} />
      <NextQueue next={nextIds} palette={palette} />
      <HoldBox hold={holdId} canHold={canHold} palette={palette} />
      <StatusToasts toasts={toasts} />
      <StartOverlay visible={!started && !gameOver} />
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
        newHigh={newHigh}
        rank={highRank}
        top={topHighscores}
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
          setNewHigh(false);
          setHighRank(undefined);
          setTopHighscores([]);
          setPaused(false);
          setStarted(false);
          setInstanceId((n) => n + 1);
        }}
      />
    </div>
  );
}

/**
 * Compute the current piece width in cells for a given id/rotation.
 */
function pieceWidthCells(
  id: import('@tetris/core').TetrominoId,
  rotation: import('@tetris/core').Rotation,
): number {
  const pts = TETROMINO_SHAPES[id][rotation];
  let minX = Infinity;
  let maxX = -Infinity;
  for (const c of pts) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
  }
  const w = maxX - minX + 1;
  return Math.max(1, w);
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
