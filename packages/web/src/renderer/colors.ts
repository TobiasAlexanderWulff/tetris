/**
 * Map encoded cell values (1..7) to display colors.
 * 0 is empty and not drawn.
 */
export type Palette = {
  bg: string;
  grid: string;
  ghost: string;
  text: string;
  panelBg: string;
  cells: Record<number, string>; // 1..7
};

const baseCells: Record<number, string> = {
  1: '#00f0f0', // I
  2: '#f0f000', // O
  3: '#a000f0', // T
  4: '#00f000', // S
  5: '#f00000', // Z
  6: '#0000f0', // J
  7: '#f0a000', // L
};

export function getPalette(name: 'default' | 'dark' | 'high-contrast'): Palette {
  switch (name) {
    case 'high-contrast':
      return {
        bg: '#000000',
        grid: '#666666',
        ghost: '#FFFFFF',
        text: '#FFFFFF',
        panelBg: 'rgba(0,0,0,0.8)',
        cells: {
          1: '#00FFFF',
          2: '#FFFF00',
          3: '#FF00FF',
          4: '#00FF00',
          5: '#FF0000',
          6: '#0000FF',
          7: '#FFA500',
        },
      };
    case 'default':
      return {
        bg: '#101216',
        grid: '#1f2937',
        ghost: '#94a3b8',
        text: '#e2e8f0',
        panelBg: 'rgba(15,15,18,0.6)',
        cells: { ...baseCells },
      };
    case 'dark':
    default:
      return {
        bg: '#0f0f12',
        grid: '#1f2937',
        ghost: '#94a3b8',
        text: '#e2e8f0',
        panelBg: 'rgba(15,15,18,0.6)',
        cells: { ...baseCells },
      };
  }
}

export function colorForCellWithPalette(v: number, p: Palette): string {
  return p.cells[v] ?? 'transparent';
}
