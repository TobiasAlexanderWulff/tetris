import React from 'react';
import type { TetrominoId } from '@tetris/core';
import type { Palette } from '../renderer/colors';
import { PiecePreview } from './PiecePreview';

/**
 * NextQueue renders a vertical list of upcoming tetromino previews.
 */
export function NextQueue({ next, palette }: { next: readonly TetrominoId[]; palette: Palette }): JSX.Element {
  const wrap: React.CSSProperties = {
    position: 'absolute',
    right: 12,
    top: 12,
    background: 'var(--panel-bg, rgba(15,15,18,0.6))',
    color: 'var(--fg, #e2e8f0)',
    padding: 8,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  };
  return (
    <div style={wrap} aria-label="next-queue">
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>NEXT</div>
      {next.map((id, idx) => (
        <PiecePreview key={`${id}-${idx}`} id={id} palette={palette} width={48} height={34} />
      ))}
    </div>
  );
}

