import React from 'react';
import type { TetrominoId } from '@tetris/core';
import type { Palette } from '../renderer/colors';
import { PiecePreview } from './PiecePreview';

/**
 * HoldBox renders the held tetromino and indicates when hold is blocked.
 */
export function HoldBox({
  hold,
  canHold,
  palette,
}: {
  hold: TetrominoId | null;
  canHold: boolean;
  palette: Palette;
}): JSX.Element {
  const wrap: React.CSSProperties = {
    display: 'grid',
    justifyItems: 'center',
    rowGap: 4,
  };
  return (
    <div className="hold-box" style={wrap} aria-label="hold-box">
      <div style={{ fontSize: 12, opacity: 0.8 }}>HOLD</div>
      <PiecePreview id={hold} palette={palette} width={52} height={40} dim={!canHold} />
      {!canHold ? <div style={{ fontSize: 10, opacity: 0.6 }}>Locked</div> : null}
    </div>
  );
}
