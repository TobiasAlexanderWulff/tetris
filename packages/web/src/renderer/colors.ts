/**
 * Map encoded cell values (1..7) to display colors.
 * 0 is empty and not drawn.
 */
/**
 * Palette of colors used by the renderer and UI.
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

/**
 * Resolve a named palette.
 * Includes a color-blind-friendly variant based on the Okabe–Ito palette.
 */
export function getPalette(
  name: 'default' | 'dark' | 'high-contrast' | 'color-blind',
): Palette {
  switch (name) {
    case 'color-blind':
      // Okabe–Ito inspired mapping for distinctiveness under CVD
      return {
        bg: '#0f0f12',
        grid: '#1f2937',
        ghost: '#a3a3a3',
        text: '#e2e8f0',
        panelBg: 'rgba(15,15,18,0.6)',
        cells: {
          1: '#56B4E9', // I — sky blue
          2: '#F0E442', // O — yellow
          3: '#CC79A7', // T — reddish purple
          4: '#009E73', // S — bluish green
          5: '#D55E00', // Z — vermillion
          6: '#0072B2', // J — blue
          7: '#E69F00', // L — orange
        },
      };
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
