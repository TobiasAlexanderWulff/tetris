# Renderer — Plan (M2)

Purpose: Implement a performant, responsive Canvas 2D renderer for the Tetris board using snapshots from the core engine. Target 60 FPS with crisp HiDPI scaling and clean layering (board, ghost, active, overlays).

## Scope

- Single `CanvasRenderer` that draws engine `Snapshot` frames.
- HiDPI support (devicePixelRatio) and responsive sizing.
- Grid/background, placed cells, ghost, active piece.
- Simple theme/colors; later theming hooks.
- Minimal overlays (FPS, pause hint) for M2.

## Public API (packages/web/src/renderer)

- `interface IRenderer`:
  - `resize(width: number, height: number, dpr: number): void` — resizes backing store and sets transform.
  - `draw(snapshot: Snapshot): void` — draws a full frame using engine snapshot.
  - `dispose(): void` — releases any resources.
- `class CanvasRenderer implements IRenderer`:
  - `constructor(canvas: HTMLCanvasElement, colors?: ColorPalette)`
- `type ColorPalette = (value: number) => string` — maps 0..7 to CSS colors.

Notes:
- Renderer knows nothing about inputs or timing; it is fed by GameLoop host.
- Avoid per-frame allocations; reuse scratch arrays and precomputed metrics.

## Drawing Details

- Coordinate system: cell grid → pixels via `cellSize` (derived from canvas size and desired layout). For M2 keep a single playfield centered with fixed aspect based on `width x heightVisible`.
- Layers:
  1) Background grid (light lines) and backdrop fill.
  2) Placed cells from `snapshot.board`.
  3) Ghost cells (translucent, dashed/alpha).
  4) Active piece (solid).
  5) Overlays: FPS text (optional), pause indicator.
- Cell rendering: rounded rects or solid squares for MVP.

## Sizing & HiDPI

- Canvas CSS size tracks container; backing size = `cssSize * dpr`.
- `context.setTransform(dpr, 0, 0, dpr, 0, 0)` ensures 1 CSS px aligns to device px.
- Compute `cellSize = min(canvasWidth/cols, canvasHeight/rows)` and center the board.

## Performance

- Avoid creating new objects inside draw loop (no arrays in hot path).
- Use `fillRect` batching per color where feasible.
- Optionally precompute board geometry (indices) per frame.

## Files To Add

- `packages/web/src/renderer/CanvasRenderer.ts`
- `packages/web/src/renderer/layout.ts` (cell size/offset helpers)
- `packages/web/src/renderer/colors.ts` (already added; wire into renderer)

## Tests

- Unit (Vitest + jsdom):
  - `layout.ts` unit tests for cell sizing/centering.
  - Smoke test: calling `resize` and `draw` doesn’t throw for a mocked snapshot.

## Acceptance Criteria (M2)

- Renders board, ghost, and active piece at 60 FPS without obvious jank.
- Resizes cleanly; no blurriness on HiDPI.
- No significant per-frame allocations (verified via quick devtools profiling).

## Risks & Mitigations

- Blurry rendering: ensure DPR transform and integer rounding.
- Slow draw: batch fills by color; prefer `fillRect` over paths.
- Layout drift: centralize sizing in `layout.ts` and cover with tests.

