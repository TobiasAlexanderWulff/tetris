# M5 — Resize & HiDPI — Plan

Goal: Ensure crisp rendering at any window size and device pixel ratio (DPR) while keeping HUD overlays aligned and performant.

## Current State

- `CanvasRenderer.resize(width, height, dpr)` applies DPR via `setTransform`.
- `GameHost` listens to `window.resize` and forwards canvas and DPR to renderer.
- HUD overlays exist and are absolutely positioned.

## Tasks

- Canvas sizing: update the backing store size to `canvas.width = cssWidth * dpr`, `canvas.height = cssHeight * dpr`; keep CSS size at CSS pixels. Center board with `computeBoardLayout`.
- Layout API: extend `computeBoardLayout` to also return gutters for HUD anchors if needed; keep single responsibility.
- Resize strategy: throttle resize handling to rAF; avoid layout thrash; update renderer once per frame.
- DPR changes: detect `matchMedia('(resolution: Xdppx)')` or read `devicePixelRatio` on resize; redraw after change.
- CSS fit: ensure canvas container scales and maintains aspect; letterbox if needed. Document sizing rules.

## Tests

- Unit: `CanvasRenderer.test.ts`
  - Resizes with various DPR values; asserts transform set; no exceptions on draw.
  - Optionally, snapshot test of `computeBoardLayout` for typical sizes (mobile/desktop).
- E2E: Playwright
  - Resize viewport from 1440×900 → 800×600 → 375×667; ensure canvas stays within container, HUD positions remain visible.
  - Verify no blurred lines (heuristic: 1px grid lines remain sharp by sampling canvas data or visual diff with tolerance).

## Acceptance

- No blurriness at common DPRs (1.0, 1.5, 2.0, 3.0); grid lines and cells remain crisp.
- FPS stable at 60 during manual resize; no obvious stutter.
- HUD components remain correctly aligned around the canvas.

