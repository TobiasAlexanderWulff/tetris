# Core Engine — Plan

Purpose: Specify the pure TypeScript Tetris engine (no DOM), including API, rules, data structures, update loop, determinism, and tests. This plan guides M1 (Core Engine Fundamentals) and subsequent gameplay milestones.

## Principles

- Pure logic: no browser/DOM; deterministic and seedable.
- Fixed-timestep updates; reproducible with input log + seed.
- Small, modular systems with clear interfaces and TSDoc on all public APIs.
- Strong test coverage for rules, edge cases, and invariants.

## Public API Surface

- `createEngine(config: EngineConfig, seed?: number): Engine`
  - Initializes engine with rules, board size, gravity curve, and RNG seed.
- `engine.enqueueInput(evt: InputEvent): void`
  - Queue normalized, discrete inputs (already DAS/ARR-processed by input layer).
- `engine.update(dtMs: number): void`
  - Advances simulation using a fixed-timestep accumulator (e.g., 16.6667 ms ticks).
- `engine.getSnapshot(): Snapshot`
  - Read-only view for rendering: board, active piece, ghost, queues, score, timers.
- `engine.serialize(): SerializedState` / `engine.deserialize(state): void`
  - For replays/saves (post-MVP optional; keep internal state serializable).
- `engine.subscribe(listener: (event: EngineEvent) => void): Unsubscribe`
  - Emits significant events (spawn, lock, lines cleared, level up, game over).

Types (selected):

- `TetrominoId = 'I'|'O'|'T'|'S'|'Z'|'J'|'L'`
- `Rotation = 0|1|2|3`
- `Vec2 { x: number; y: number }` (immutable where exposed)
- `InputEvent`:
  - `MoveLeft`, `MoveRight`, `RotateCW`, `RotateCCW`, `Rotate180` (optional), `SoftDropStart/Stop`, `HardDrop`, `Hold`.
  - Include `at: number` (ms) for ordering; engine processes by tick time.
- `EngineEvent`:
  - `PieceSpawned`, `PieceMoved`, `PieceRotated`, `HardDropped`, `SoftDropStep`, `Locked`, `LinesCleared { count, rows }`, `LevelChanged`, `ScoreChanged`, `GameOver`.
- `Snapshot`:
  - `board: Uint8Array` (10×(20+buffer) flattened), `width`, `heightVisible`, `bufferRows`.
  - `active: { id, cells: Vec2[], position: Vec2, rotation } | null`.
  - `ghost: Vec2[] | null`.
  - `hold: TetrominoId | null`, `canHold: boolean`.
  - `next: TetrominoId[]` (e.g., at least 5).
  - `score`, `level`, `linesClearedTotal`.
  - `timers: { lockMsLeft: number | null }`.

## Rules & Mechanics (Guideline-Inspired)

- Board: 10×20 visible; 2–4 hidden buffer rows on top for spawn.
- Spawn: standard spawn positions and orientations per SRS; initial position at the top-center above visible playfield.
- Randomizer: 7-bag shuffled uniformly; pop until empty then reshuffle.
- Rotation: SRS with wall kicks; I-piece has separate kick table. Optional 180° rotate (config flag).
- Movement: left/right; collision-checked; rotation uses kick tests in order.
- Gravity: level → cells/sec; accumulate fractional progress; one cell drop per full step.
- Locking: lock delay timer starts on ground contact; resets on movement/rotation with a cap on resets; hard drop locks instantly; soft drop increases gravity rate without instant lock.
- Line Clears: detect full rows, remove, compact above rows downward in one step; report cleared row indices.
- Scoring (baseline): Single=100, Double=300, Triple=500, Tetris=800; soft drop=+1/step, hard drop=+2/step; back-to-back (×1.5) and combo (+incremental) configurable.
- Level: increase per N lines; update gravity accordingly.
- Hold: one hold per piece until lock; swapping with hold piece if present; no direct immediate re-hold.
- Game Over: piece cannot spawn legally within buffer.

## Data Structures

- Board grid: `Uint8Array` length = `width * (heightVisible + bufferRows)`; row-major; 0=empty, 1..7=tetromino id.
- Active piece: `{ id, rotation, position, shape: CellOffsets[Rotation] }` where `CellOffsets` precomputed per piece.
- SRS tables: constant lookup maps for kicks per piece type.
- Bag randomizer: Fisher–Yates on `[I,O,T,S,Z,J,L]`; keep queue of at least `k` next items.
- Ghost: compute by dropping active until collision; cached and recomputed on state change.
- Timers: `lockMsLeft`, `gravityAccumulatorMs` numbers; `lockResetsUsed` integer.
- Metrics: `score`, `level`, `linesClearedTotal`, `backToBack`, `comboCount`.
- RNG: fast deterministic PRNG (e.g., SplitMix32 or XorShift128+). Store full state in engine.

## Update Loop (Fixed Timestep)

- Engine keeps `accumulatorMs` and processes in fixed `TICK_MS = 16.6667` steps.
- Per tick pipeline:
  1. Dequeue and apply all `InputEvent`s with `evt.at <= tickTime` in arrival order.
     - Apply move/rotate/hold/hard drop; enforce `canHold`.
  2. Gravity: add `gravityRate(level) * TICK_MS` to accumulator; drop by one cell for each full cell threshold, handling collision; when grounded, start/continue lock delay.
  3. Lock: if grounded and `lockMsLeft <= 0`, place piece into board, trigger line clear check, spawn next piece, reset hold allowance.
  4. Line clears: remove full rows; update score/level/combo/back-to-back; emit `LinesCleared`.
  5. Update ghost cache and timers in `Snapshot`.
- Hard Drop: move piece down until collision-1, add hard-drop score per step, then lock immediately (bypasses lock delay).
- Soft Drop: increases gravity rate while active (flag toggled via inputs).

## Collision & Rotation (SRS)

- Collision: for each cell of the active piece (position + offset), check bounds and board occupancy.
- Rotation: try kicks sequentially from SRS kick table for `(fromRot, toRot)` and piece id; on first valid placement, commit rotation.
- Edge cases: floor kicks, T-spins (detection optional post-M1).

## Events & Snapshotting

- Emitted events (for UI/audio/effects): `PieceSpawned`, `PieceMoved`, `PieceRotated`, `HardDropped`, `Locked`, `LinesCleared`, `LevelChanged`, `ScoreChanged`, `GameOver`.
- `Snapshot` reflects current state and is cheap to obtain (no deep copies of big arrays; expose read-only views or copies as needed).

## Configuration

- `EngineConfig` defaults with overrides:
  - `width=10`, `heightVisible=20`, `bufferRows=2`.
  - `showNext=5`, `allow180=false`.
  - `lockDelayMs=500`, `maxLockResets=15`.
  - `gravityTable: Record<level, cellsPerSecond>` (document baseline curve).
  - `scoring: { single, double, triple, tetris, softPerCell, hardPerCell, b2bMultiplier, comboBase }`.

## Module Layout (packages/core/src)

- `types/` — shared types (`Vec2`, `Rotation`, ids, events)
- `random/` — PRNG + 7-bag
- `rotations/` — SRS data tables (I vs JLSTZ)
- `board/` — grid ops, line detection/clear, compaction
- `pieces/` — tetromino definitions and spawn metadata
- `systems/` — gravity, lock, scoring, level, ghost
- `game/` — engine orchestrator (inputs, tick pipeline, events, snapshot)
- `index.ts` — public API re-exports

## Invariants

- Board cells ∈ {0..7} at all times; active piece not written to board.
- Active piece cells never overlap board occupied cells or go OOB.
- After line clear, board compaction preserves relative order of non-cleared rows.
- Determinism: given same seed and input sequence (timestamped), resulting snapshots/events identical.

## Test Plan (Vitest)

Unit tests:

- Randomizer: 7 items per bag, uniform permutations; determinism by seed.
- Spawn: each piece spawns legally at configured position and rotation.
- Movement: left/right into walls and blocks; no tunneling.
- Rotation (SRS): specific wall kick cases for each piece; I-piece special table; rotation near walls and floor.
- Gravity: piece drops correct number of cells over time; respects collisions.
- Lock delay: starts on contact; resets on movement/rotation up to cap; hard drop locks immediately.
- Line clears: single/double/triple/tetris scenarios; indices and compaction validated.
- Scoring: points awarded match table; soft/hard drop increments; b2b and combos when enabled.
- Hold: single hold per piece until lock; swap correctness.
- Ghost: matches final valid drop position.
- Game over: spawning blocked when stack reaches spawn area.

Property tests (where sensible):

- Rotation preserves piece cell count (exactly 4).
- Valid placements never overlap; invalid ones are rejected.
- Clearing a full row yields an empty row afterwards and total block count decreases accordingly.

Scenario tests (deterministic):

- Golden sequences using fixed seed + scripted inputs; assert final board hash/score/level.

Test utilities:

- Seeded PRNG helper for tests; factory to step engine by ticks; builders for board states.

## Performance Considerations

- Avoid per-tick allocations; reuse arrays for ghost cells and scratch buffers.
- Use typed arrays for board; precompute piece rotation offsets.
- Keep hot paths branch-light; cache frequently accessed values.

## Implementation Tasks (M1)

1) Types and data constants
2) PRNG + 7-bag randomizer
3) Board grid + collision helpers
4) Tetromino definitions + SRS tables
5) Engine orchestrator: spawn, move, rotate, gravity, lock (no lines initially)
6) Line clear + compaction
7) Basic scoring and level progression
8) Ghost + hold mechanics
9) Events + snapshot API
10) Unit tests for all above

Acceptance criteria (M1):

- Deterministic tick sequences produce expected board states.
- All unit tests pass; coverage for rotations, gravity, lock, and line clears.
- Public API documented with TSDoc and stable for web package consumption.

## Open Questions / Later Milestones

- 180° rotation default off or on (configurable; off for MVP).
- Full T-Spin detection for advanced scoring (M3+).
- Replay format (seed + input log) and serialization (post-MVP).
- Garbage and multiplayer (separate track after MVP).

