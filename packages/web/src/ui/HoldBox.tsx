import React from 'react';
import type { TetrominoId } from '@tetris/core';
import type { Palette } from '../renderer/colors';
import { PiecePreview } from './PiecePreview';

/**
 * HoldBox renders the held tetromino and indicates when hold is blocked.
 */
export function HoldBox({ hold, canHold, palette }: { hold: TetrominoId | null; canHold: boolean; palette: Palette }): JSX.Element {
  const wrap: React.CSSProperties = {
    position: 'absolute',
    left: 12,
    top: 96,
    background: 'var(--panel-bg, rgba(15,15,18,0.6))',
    color: 'var(--fg, #e2e8f0)',
    padding: 8,
    borderRadius: 8,
    display: 'grid',
    justifyItems: 'center',
    rowGap: 4,
  };
  return (
    <div style={wrap} aria-label="hold-box">
      <div style={{ fontSize: 12, opacity: 0.8 }}>HOLD</div>
      <PiecePreview id={hold} palette={palette} width={52} height={40} dim={!canHold} />
      {!canHold ? <div style={{ fontSize: 10, opacity: 0.6 }}>Locked</div> : null}
    </div>
  );
}

