import React, { useEffect, useRef } from 'react';
import { createDefaultEngine, GameHost } from '../game/GameHost';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { KeyboardInput } from '../input/KeyboardInput';

// KeyboardInput is now used; no no-op input needed.

/**
 * GameCanvas mounts the game host: engine + renderer + input.
 */
export function GameCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<GameHost | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = createDefaultEngine();
    const renderer = new CanvasRenderer(canvas);
    const input = new KeyboardInput();
    const host = new GameHost(canvas, engine, renderer, input);
    hostRef.current = host;
    host.start();
    return () => {
      host.dispose();
      hostRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
