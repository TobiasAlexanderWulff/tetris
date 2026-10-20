import React from 'react';
import type { TetrominoId } from '@tetris/core';
import type { Palette } from '../renderer/colors';
import { PiecePreview } from './PiecePreview';

const COMPACT_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 600px)';

/** Track whether the queue should use the fixed three-piece landscape variant. */
function useCompactLandscape(): boolean {
  const [matches, setMatches] = React.useState(() =>
    typeof window.matchMedia === 'function'
      ? window.matchMedia(COMPACT_LANDSCAPE_QUERY).matches
      : false,
  );

  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia(COMPACT_LANDSCAPE_QUERY);
    const updateMatch = (): void => setMatches(mediaQuery.matches);
    updateMatch();
    mediaQuery.addEventListener('change', updateMatch);
    return () => mediaQuery.removeEventListener('change', updateMatch);
  }, []);

  return matches;
}

/**
 * NextQueue renders a vertical list of upcoming tetromino previews.
 */
export function NextQueue({
  next,
  palette,
}: {
  next: readonly TetrominoId[];
  palette: Palette;
}): JSX.Element {
  const wrap: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  };
  const visibleNext = useCompactLandscape() ? next.slice(0, 3) : next;

  return (
    <div className="next-queue" style={wrap} aria-label="next-queue">
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>NEXT</div>
      {visibleNext.map((id, idx) => (
        <PiecePreview key={`${id}-${idx}`} id={id} palette={palette} width={48} height={34} />
      ))}
    </div>
  );
}
