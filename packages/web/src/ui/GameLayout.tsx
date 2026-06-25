import React from 'react';

/** Props defining the visual regions around the game canvas. */
export interface GameLayoutProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  touchControlsEnabled: boolean;
  touchControls?: React.ReactNode;
  pauseDisabled: boolean;
  onPause: () => void;
  hud: React.ReactNode;
  hold: React.ReactNode;
  next: React.ReactNode;
  status?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Organizes the board, compact HUD, previews, touch actions, and overlays.
 */
export function GameLayout({
  canvasRef,
  touchControlsEnabled,
  touchControls,
  pauseDisabled,
  onPause,
  hud,
  hold,
  next,
  status,
  children,
}: GameLayoutProps): JSX.Element {
  return (
    <div
      className="game-layout"
      data-touch-controls={String(touchControlsEnabled)}
      aria-label="game-layout"
    >
      <aside className="game-layout__left-rail" aria-label="left-game-controls">
        <header className="game-layout__hud">
          {hud}
          {touchControlsEnabled ? (
            <button
              className="game-layout__pause-button"
              type="button"
              disabled={pauseDisabled}
              onClick={onPause}
              aria-label="Pause game"
            >
              II
            </button>
          ) : null}
        </header>
        <aside className="game-layout__hold">{hold}</aside>
      </aside>
      <main className="game-layout__board" aria-label="board-region">
        <canvas ref={canvasRef} className="game-layout__canvas" aria-label="Tetris board" />
      </main>
      <aside className="game-layout__right-rail" aria-label="right-game-controls">
        <aside className="game-layout__next">{next}</aside>
        {touchControls ? (
          <div className="game-layout__touch-controls" aria-label="touch-control-region">
            {touchControls}
          </div>
        ) : null}
      </aside>
      {status}
      <div className="game-layout__overlays">{children}</div>
    </div>
  );
}
