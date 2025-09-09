# M5 — Animations & Juice — Plan

Goal: Add tasteful animations (line clear flash, spawn pop, optional particles) controllable by a single `animations` setting and honoring prefers‑reduced‑motion.

## Current State

- `settings.animations` exists and is wired in `GameCanvas` for toasts. No board animations implemented yet.

## Tasks

- Effects model: lightweight effect scheduler in UI layer that subscribes to engine events (LinesCleared, PieceSpawned, PieceLocked).
- Line clear: brief flash on cleared rows (alpha/overlay) with duration ≤ 150 ms; ensure no seizure risk (limit brightness/frequency).
- Spawn pop: scale‑in of active piece for ~120 ms on spawn; easing; clamp to respect reduced‑motion.
- Optional particles: minimal cell burst on Tetris; disabled by default on mobile or when animations off.
- Global toggle: gate all effects behind `settings.animations`; auto‑disable when `prefers-reduced-motion` unless user explicitly enables.
- Performance: batch effect draws in the same canvas pass; avoid extra React renders.

## Tests

- Unit: effect scheduler pure logic (timing advancement and lifecycle) where feasible.
- E2E: toggle animations on/off; verify effects present/absent; `prefers-reduced-motion` simulated via emulation.

## Acceptance

- Effects are visible when enabled, removed when disabled; no measurable FPS degradation; reduced‑motion is respected by default.

