# Gameplay — Plan (M3)

Purpose: Implement line clear scoring, level progression, gravity speed curve, back-to-back (B2B), and combos. Expose stats in snapshots/events and add tests. Aligns with plan.md M3.

## Scope

- Engine: scoring system, level system, combo + B2B tracking, gravity curve by level.
- Events: emit `ScoreChanged`, `LevelChanged`, and augment `LinesCleared` with meta (b2b/combo flags).
- Snapshot: include `score`, `level`, `linesClearedTotal` (already planned) — ensure updated coherently.
- Web (light): render basic HUD (score, level, lines) — minimal placeholder; detailed UI in M4.

## Engine Changes

- Data:
  - `metrics`: `{ score: number, level: number, linesClearedTotal: number, combo: number, b2b: boolean }`.
  - `config.scoring`: tables (see below) and `levelLines: number` (lines per level-up) or a curve function.
  - `config.gravityTable`: map `level -> cellsPerSecond`.
- Line Clear Handling:
  - After `place()` and `clearFullRows()`, compute score delta based on number of lines cleared and T-Spin (T-Spin optional post-M3; for M3 treat only standard clears).
  - Update `combo`: if lines cleared > 0, `combo++` then add combo bonus; else reset `combo = -1` (first clear after drought yields combo 0 bonus or configured base).
  - Update `b2b`: if clear is Tetris (4-line) (and later T-Spin), B2B continues; non-B2B action resets.
  - Increment `linesClearedTotal` by count; recalc `level` when threshold crossed; on level up, emit event and adjust gravity (read from table).
- Gravity Integration:
  - Replace current single `gravityCps` with lookup by current `level` (config default table). Keep soft drop multiplier.

## Scoring Tables (Baseline)

- Line Clears (base points):
  - Single: 100
  - Double: 300
  - Triple: 500
  - Tetris (4): 800
- Drop Bonuses:
  - Soft drop: +1 per cell
  - Hard drop: +2 per cell (engine can accumulate during hard drop; tracked in-place)
- Back-to-Back:
  - Multiplier ×1.5 applied to Tetris (and later T-Spin) if `b2b=true`.
- Combo:
  - Additive bonus per consecutive clear after the first: e.g., `comboBase * (comboIndex)` or table `[0, 50, 100, 150, ...]`.
- Level Up:
  - Every N lines (default `levelLines = 10`) increases `level++;` gravity adjusted from `gravityTable`.

All values configurable via `EngineConfig.scoring` and `gravityTable`.

## API & Types

- `EngineConfig` additions:
  - `scoring: { single: number; double: number; triple: number; tetris: number; softPerCell: number; hardPerCell: number; b2bMultiplier: number; comboBase: number; levelLines: number }`
  - `gravityTable: Record<number, number>` mapping level → cellsPerSecond (provide defaults for levels 0..20; clamp to last for higher).
- `Snapshot` additions/verify:
  - `score: number; level: number; linesClearedTotal: number` (ensure exposed).
- `EngineEvent` extensions:
  - `ScoreChanged { delta: number; score: number }`
  - `LevelChanged { level: number }`
  - `LinesCleared { count: number; rows: number[]; b2b: boolean; combo: number }`

## Implementation Tasks

1) Extend `EngineConfig` with `scoring` and `gravityTable` defaults; add metrics to engine state.
2) Track soft/hard drop cells to compute drop bonuses (hard drop already loops; count steps; soft drop: count gravity steps while `softDropping`).
3) Implement score calculation on clear: base points + b2b multiplier + combo bonus + drop bonuses per piece; update `score` and emit `ScoreChanged`.
4) Implement level progression: increment when `linesClearedTotal` crosses threshold; update gravity lookup; emit `LevelChanged`.
5) Update snapshot to include metrics fields.
6) Tests: unit tests for scoring, combo, b2b, level-ups, gravity curve switch.
7) Web HUD (minimal): render `score`, `level`, `lines` in GameCanvas overlay (non-blocking; basic text is enough for M3).

## Tests (Vitest)

- Scoring:
  - Single/Double/Triple/Tetris yield correct base points.
  - Hard drop cells tally and grant +2 per cell; soft drop +1 per cell.
  - Back-to-back: two consecutive Tetrises apply ×1.5 to the second; breaking sequence resets b2b.
  - Combos: consecutive clears increment combo and add bonuses.
- Levels & Gravity:
  - Clearing lines raises `linesClearedTotal` and `level` after threshold; gravity cps switches according to table.
  - Events `ScoreChanged`, `LevelChanged` emitted with expected payloads.
- Edge cases:
  - No clear → combo reset; no score added from base table (only drop bonuses if any for that piece).
  - Gravity cps clamped to last defined table entry.

## Defaults

- `levelLines = 10`.
- `gravityTable` example (levels → cps): 0: 1.0, 1: 1.2, 2: 1.5, 3: 1.9, 4: 2.3, 5: 3.0, 6: 4.0, 7: 5.0, 8: 6.5, 9: 8.0, 10+: 10.0 (tune later).
- Scoring as listed above; `comboBase = 50`, `b2bMultiplier = 1.5`.

## Acceptance Criteria

- Engine updates `score`, `level`, `linesClearedTotal` deterministically; emits events; gravity reflects current level.
- Unit tests for all items above pass.
- Minimal HUD displays live values in the web app (optional if gated for M4).

## Risks & Mitigations

- Precision: keep scores as integers; avoid floating accumulation errors — compute drop bonuses via integer step counts.
- Performance: no per-tick allocations for metrics; precompute gravity cps per level.
- Future T-Spins: design scoring extension points (flag in `LinesCleared` and calculation hook) so later T-Spin detection slots in.

