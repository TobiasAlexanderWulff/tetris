import React, { useEffect, useRef } from 'react';

/**
 * Canvas with an FPS counter.
 *
 * This component sets up a requestAnimationFrame loop and renders the
 * measured FPS as text in the corner. It serves as the placeholder game
 * surface for M0.
 */
export function FpsCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const context = ctx;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    function resize() {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();
    let frames = 0;
    let fps = 0;
    let fpsTimer = 0;

    function loop(now: number) {
      const dt = now - last;
      last = now;
      fpsTimer += dt;
      frames += 1;
      if (fpsTimer >= 1000) {
        fps = frames;
        frames = 0;
        fpsTimer -= 1000;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      // Background placeholder
      context.fillStyle = '#0f0f12';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // FPS text
      context.fillStyle = '#e2e8f0';
      context.font = '16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      context.fillText(`FPS: ${fps}`, 12, 24);

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
