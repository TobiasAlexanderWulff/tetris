/**
 * Map encoded cell values (1..7) to display colors.
 * 0 is empty and not drawn.
 */
export function colorForCell(v: number): string {
  switch (v) {
    case 1:
      return '#00f0f0'; // I
    case 2:
      return '#f0f000'; // O
    case 3:
      return '#a000f0'; // T
    case 4:
      return '#00f000'; // S
    case 5:
      return '#f00000'; // Z
    case 6:
      return '#0000f0'; // J
    case 7:
      return '#f0a000'; // L
    default:
      return 'transparent';
  }
}

