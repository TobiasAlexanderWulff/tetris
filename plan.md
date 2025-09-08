# Tetris Game — Top‑Level Implementation Plan

This document outlines the high‑level plan to implement a modern, guideline‑inspired Tetris. It defines the tech stack, architecture, major milestones, testing strategy, and project structure. Detailed work for larger tasks will be captured in dedicated `<TaskName>-Plan.md` files as we execute the plan.

## 1) Goals & Scope

- Deliver a polished, responsive single‑player Tetris MVP that runs at 60 FPS.
- Adhere to common Tetris Guideline mechanics where practical (SRS, 7‑bag, scoring, soft/hard drop, hold, next queue, ghost piece).
- Ship as a web app (desktop + mobile friendly); consider stretch goals later (replays, multiplayer, AI).
- Maintain a clean, modular, well‑documented codebase with strong automated tests.

## 2) Tech Stack

Primary (recommended): Web, TypeScript, Canvas

- Language: TypeScript (strict mode) for type safety and maintainability.
- Build: Vite for fast local dev and simple builds.
- UI: React for menus/overlays; game view rendered via Canvas 2D.
- State: Zustand (or Redux Toolkit) for app/UI state; game state lives in the core engine module.
- Rendering: Canvas 2D (simple, fast, widely supported). Abstract renderer to enable WebGL in the future.
- Audio: Web Audio API for SFX/music with user volume and mute controls.
- Testing: Vitest (unit), Playwright (E2E), ESLint + Prettier (lint/format), TypeScript type‑checks in CI.
- Packaging: pnpm workspaces (monorepo) or single repo with `packages/`.
- CI: GitHub Actions for lint, type‑check, unit, and E2E.

Alternatives (documented, not chosen for MVP):

- Python + Pygame (desktop app; quick prototyping, less portable to web).
- Rust + Bevy (high performance; steeper ramp, native builds).
- Unity/Godot (rich tooling; heavier runtime/asset pipeline).

## 3) Architecture Overview

- Core Engine (framework‑agnostic TS):
  - Pure logic; no DOM/browser dependencies.
  - Models: `Board`, `Piece`, `Tetromino`, `BagRandomizer`, `RotationSystem (SRS)`, `ScoreSystem`, `LevelSystem`.
  - Systems: gravity, collision, locking/lock‑delay, line clears, scoring, combo/back‑to‑back, garbage (future), inputs (abstracted), replay (future).
  - Game Loop: fixed‑timestep update with accumulator; render interpolation optional.
- Renderer Abstraction:
  - `IRenderer` interface; `CanvasRenderer` for MVP. Future `WebGLRenderer` optional.
  - Layered draw order: background grid → placed cells → ghost → active piece → overlays/effects/UI.
- Input Layer:
  - Keyboard + gamepad mapping, configurable DAS/ARR for movement repeat; soft/hard drop; rotate CW/CCW/180; hold.
  - Input events normalized and queued for the engine update step.
- Scenes/States:
  - Boot → Main Menu → Play → Pause → Game Over → Settings → (optional) Replay.
- Persistence:
  - Local storage for settings (bindings, DAS/ARR, volume), last score table, best times/scores.

## 4) Gameplay Mechanics (Guideline‑Inspired)

- 7‑Bag randomizer, re‑shuffled when exhausted.
- SRS rotation with wall kicks; optional 180 rotation (toggle).
- Gravity curve tied to level; soft drop increases fall rate, hard drop locks instantly.
- Lock delay and move reset rules to feel correct and fair.
- Line clears: single, double, triple, Tetris; T‑Spin detection (mini/full) optional for v1.1.
- Scoring and level progression per commonly used tables (documented below).
- Ghost piece, hold piece, next queue (e.g., show next 5).

## 5) Milestones & Exit Criteria

M0 — Project Setup

- Create repo structure, toolchain (Vite, TS, ESLint/Prettier, Vitest), CI scaffolding.
- Placeholder app with a blank canvas and FPS counter.
- Exit: `pnpm dev` runs, CI passes lint+typecheck.

M1 — Core Engine Fundamentals

- Data models: board grid (10×20 + buffer rows), pieces, bag randomizer, SRS rotation data.
- Core operations: spawn, move left/right, rotate CW/CCW, gravity step, collision checks, lock/lock‑delay.
- Unit tests for movement, rotation kicks, lock behavior.
- Exit: deterministic tick sequences produce expected board states; tests pass.

M2 — Rendering + Input + Loop

- Fixed‑timestep loop; `CanvasRenderer` draws board/piece at 60 FPS.
- Input mapping (keyboard), DAS/ARR handling, soft/hard drop, hold.
- Exit: can play a minimal game: move/rotate/drop a piece until stack tops out.

M3 — Line Clears, Scoring, Levels

- Line detection/removal with gravity settle of above rows.
- Implement scoring tables and level speed curve; basic combo and back‑to‑back.
- Exit: clearing lines adjusts score/level appropriately; tests cover edge cases.

M4 — UX Features

- Next queue rendering, ghost piece, hold UI, pause, game over, settings menu.
- Audio: SFX for rotate, drop, lock, line clear; music toggle.
- Exit: playable, polished single‑player experience with settings persisted.

M5 — Polish & Accessibility

- Screen resize & HiDPI scaling; color‑blind friendly palettes; key remapping.
- Simple animations/juice (line clear flash, spawn pop, particles optional).
- Exit: passes accessibility checklist; stable 60 FPS on typical devices.

M6 — Stretch Goals (post‑MVP)

- Replays (input log + seed), leaderboards (local), mobile controls (touch UI), gamepad support.
- Advanced scoring (full T‑Spin spec), Sprint/Marathon modes, Daily challenge.
- Online multiplayer (rollback/netcode) — separate track.

## 6) Data & Algorithms (Core Specs)

- Board:
  - Dimensions: 10×20 visible rows + N hidden buffer rows (e.g., 2–4) at the top for spawn.
  - Representation: `Uint8Array` or number matrix; 0 = empty, 1..7 = tetromino ids; flags for garbage/garbage‑proof optional.
- Pieces & Rotations:
  - Define tetromino shapes (I, O, T, S, Z, J, L) with orientation matrices.
  - SRS wall kick tables for each piece (I has special kicks).
- Randomizer:
  - 7‑bag: uniform shuffle, pop until empty, then reshuffle.
- Collision:
  - Check candidate piece cells against board bounds and occupancy.
- Locking:
  - Lock delay timer; reset on piece movement/rotation (bounded resets).
- Line Clears:
  - Scan rows for full occupancy; remove and compact; report clear count for scoring.
- Scoring/Levels (baseline):
  - Single=100, Double=300, Triple=500, Tetris=800; soft drop=1/step, hard drop=2/step.
  - Back‑to‑back bonus (e.g., ×1.5), combo incremental bonus; configurable.
  - Level increases after N lines; gravity table maps level→fall rate.

## 7) Rendering Plan (Canvas)

- Coordinate system: integer cell grid mapped to pixels via `cellSize`. Use scale factor for HiDPI.
- Draw order: background grid → placed cells → ghost (translucent) → active piece → effects → UI.
- Sizing/responsiveness: compute canvas size based on viewport while maintaining aspect; letterbox UI.
- Assets: vector‑friendly assets where possible; pre‑load audio buffers; simple theme system.

## 8) Input Handling Details

- Default bindings: Left/Right, Rotate CW/CCW/180, Soft Drop, Hard Drop, Hold, Pause.
- DAS/ARR: configurable delays with sane defaults; implement key repeat using timestamps.
- Gamepad: optional post‑MVP; provide mapping and deadzone handling.

## 9) Testing Strategy

- Unit Tests (Vitest):
  - Board operations: collision, rotation kicks, line clears, lock delay.
  - Randomizer determinism via seeded RNG for reproducible tests.
  - Scoring/level progression tables and edge cases.
- Property Tests (where useful):
  - Rotations preserve piece cell count; no overlaps on valid placements.
- E2E Tests (Playwright):
  - Start game, place pieces, clear lines, verify score/level changes.
  - Pause/resume, settings persistence, resize behavior.
- Performance:
  - Basic FPS budget check in CI (headless measurement) and manual profiling docs.
- CI Gates:
  - Lint, typecheck, unit → E2E on PRs; require passing before merge.

## 10) Project Structure (Monorepo)

```
packages/
  core/                 # pure TS engine (no DOM)
    src/
      board/
      pieces/
      systems/
      index.ts
    tests/
  web/                  # React app + Canvas renderer
    src/
      renderer/
      scenes/
      ui/
      app.tsx
    public/
    e2e/                # Playwright specs
  assets/
    audio/
    fonts/
    themes/
scripts/
```

Notes:

- Each package exports clear interfaces. No circular dependencies.
- All components, classes, and public methods include docstrings (TSDoc) with examples.
- Keep files small; split into submodules if they grow too large.

## 11) Coding Standards

- TypeScript strict mode; no `any` in core; prefer pure functions for logic.
- TSDoc for every component/class/method; meaningful names; no one‑letter variables.
- Small modules, clear interfaces, explicit exports; avoid global state.
- Commit hygiene; conventional commits optional; PRs gated by CI.

## 12) Planned `<TaskName>-Plan.md` Documents

We will create detailed plans as we begin each major task, for example:

- CoreEngine-Plan.md — data structures, SRS tables, update loop specifics, test matrix.
- Renderer-Plan.md — canvas pipeline, scaling, draw perf, theming.
- Input-Plan.md — key repeat implementation (DAS/ARR), rebinding, gamepad.
- Gameplay-Plan.md — scoring tables, combos, back‑to‑back, level curve.
- UI-Plan.md — menus, settings, overlays, accessibility.
- Audio-Plan.md — asset pipeline, mixing, latency mitigation.
- Persistence-Plan.md — local storage schema, migration, validation.
- E2E-Plan.md — Playwright scenarios, fixtures, performance checks.
- Multiplayer-Plan.md (stretch) — netcode, rooms, rollback plan.
- Replay-Plan.md (stretch) — deterministic seed + input log format.

## 13) Risks & Mitigations

- Timing/feel inconsistencies: use fixed‑step updates; tests for lock delay and DAS/ARR.
- Rotation edge cases: comprehensive SRS unit tests and visual debug overlay.
- Performance on mobile: keep Canvas simple; minimize allocations; profile.
- Input latency: buffer inputs per frame; avoid GC churn; optional gamepad.
- Accessibility/contrast: color‑blind palettes; scale UI; configurable controls.

## 14) Timeline (Rough)

- Week 1: M0–M1
- Week 2: M2
- Week 3: M3–M4
- Week 4: M5 and stabilization; identify stretch goals.

## 15) Definition of Done (MVP)

- You can play a full game: movement, rotation, hold, ghost, next, soft/hard drop, line clears, scoring, levels, game over.
- 60 FPS on mid‑range hardware; responsive resize; keyboard controls.
- Settings persist; audio works; all core logic covered by unit tests; essential flows covered by E2E.
- CI green; repo structure clean and documented; public APIs documented via TSDoc.

