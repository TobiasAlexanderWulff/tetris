# Audio (Music & SFX) — Implementation Plan

## Goals

- Deliver clear, polished game audio: responsive SFX and seamless looping music.
- Keep audio modular and testable: a small core service with Web Audio adapters.
- Provide robust controls: separate music/SFX volumes, mute, and persistence.
- Minimize latency and glitches: predecode assets, schedule precisely, avoid clipping.

## Scope (MVP)

- SFX: rotate, hard drop, lock, line clear, tetris, hold, level up, game over, UI clicks.
- Music: 1–2 looping tracks with clean loop points and start/stop/crossfade.
- Settings: music volume, SFX volume, master mute; persist to local storage.
- Integration: audio reacts to engine events; UI toggles reflect and control state.

Out of scope (can follow later): dynamic stems, sidechain ducking, reverb/FX bus, soundtrack selection, spatial audio.

## Asset Direction

- Style: modern, clean, not noisy; short, tight one‑shots for responsiveness. Avoid overbearing “move” sounds.
- Format: primary `.ogg` (Vorbis), fallback `.mp3` if needed. Keep 44.1 kHz to match most hardware.
- Budget: SFX ≤ 200 ms each; total decoded audio ≤ ~5–8 MB for MVP.
- Looping music: provide exact loop points; export seamless loops (or include 1‑bar pre‑roll + defined `loopStart`).

Proposed SFX list (ids → description):

- `rotate_cw`, `rotate_ccw`, `rotate_180` (optional): soft “click” with slight pitch variation.
- `hard_drop`: firm, short impact; distinct from `lock`.
- `lock`: subtle confirm thud.
- `line_clear`: bright shimmer; pitch‑shift per combo count (±2–4%).
- `tetris`: stronger variant or stinger; can reuse `line_clear` with layered hit.
- `hold`: soft UI‑like tick.
- `level_up`: short rising arpeggio.
- `game_over`: down‑gliss or low chord.
- `ui_click`, `ui_confirm`, `ui_back`.

Music (tracks):

- `theme_main`: main loop for gameplay.
- `menu_ambient` (optional): calmer loop for menus/pause.

## Architecture

- `IAudio` (interface): `playSfx(id, opts?)`, `playMusic(id, opts?)`, `stopMusic(opts?)`, `crossfade(toId, secs)`, `setVolume(kind, value)`, `muteAll(flag)`, `preload(manifest)`, `resumeOnUserGesture()`.
- `AudioService` (core): stateful controller implementing `IAudio` with no UI or engine coupling.
- `WebAudioAdapter` (infra): holds `AudioContext`, `GainNode`s, decoded buffers, and performs scheduling.
- Buses: `master → musicGain`, `master → sfxGain` (+ optional `uiGain` derived from sfx).
- Config: polyphony caps per SFX id, default detune spread, global rate/pitch variance bounds.

File structure (proposed):

```
packages/
  core/               # engine stays audio‑agnostic
  web/
    src/
      audio/
        AudioService.ts
        WebAudioAdapter.ts
        manifest.ts       # ids → url + options (loop points, gain, polyphony)
        index.ts
    public/
      audio/
        sfx/*.ogg
        music/*.ogg
```

## Event Mapping (Engine → Audio)

- `onRotate(dir)` → `rotate_cw/rotate_ccw`; `rotate_180` if enabled.
- `onHardDrop()` → `hard_drop`.
- `onLock()` → `lock` (guard against double‑fires during lock delay).
- `onLineClear(n, combo, b2b)` → `line_clear` with pitch/volume mod; if `n===4 || b2b` then layer stinger.
- `onHold()` → `hold`.
- `onLevelUp(level)` → `level_up` (rate up slightly with higher levels).
- `onGameOver()` → `game_over`, stop music or crossfade to low pad.
- Scene/UI events: menu open/close/clicks → `ui_*`.

Notes:

- Avoid “move left/right” SFX by default to reduce noise; consider optional, gated by sensitivity.
- Throttle repetitive triggers (e.g., rotation repeat) using a short cooldown (e.g., 30–60 ms per id).

## Scheduling & Mixing

- Create `AudioContext({ latencyHint: 'interactive' })` on first user gesture.
- Predecode all SFX; fetch + decode music before gameplay or lazily with a spinner.
- One‑shots: new `AudioBufferSourceNode` per play; connect → set `playbackRate.detune` → start at `currentTime`.
- Variations: random detune ±20–40 cents; small gain jitter (±1 dB) for life.
- Music: use `loop`, `loopStart`, `loopEnd` for sample‑accurate loops.
- Crossfades: ramp `musicGain` A→0 and B 0→target over 0.6–1.5 s; equal‑power curve.
- Safety: insert a `DynamicsCompressorNode`/limiter on master to avoid clipping.

## Settings & Persistence

- Sliders: `Music Volume (0–100%)`, `SFX Volume (0–100%)`; toggle `Mute`.
- Persist: `localStorage` key `audio.v1 = { music, sfx, muted }`.
- Apply on boot; update live on change; expose getters for UI sync.

## Latency & Performance

- Decode in advance; reuse buffers; avoid creating unnecessary nodes.
- Limit concurrent SFX voices per id (e.g., max 4–6 for clears).
- Keep assets small; prefer mono SFX; avoid heavy convolution reverb in MVP.
- Use `suspend()` on hidden tab if desired; resume on focus (configurable).

## Manifest Example (concept)

```ts
export const audioManifest = {
  sfx: {
    rotate_cw: { url: '/audio/sfx/rotate_cw.ogg', gain: 0.8, maxPoly: 6 },
    rotate_ccw: { url: '/audio/sfx/rotate_ccw.ogg', gain: 0.8, maxPoly: 6 },
    hard_drop: { url: '/audio/sfx/hard_drop.ogg', gain: 0.9, maxPoly: 4 },
    lock: { url: '/audio/sfx/lock.ogg', gain: 0.7, maxPoly: 8 },
    line_clear: { url: '/audio/sfx/line_clear.ogg', gain: 1.0, maxPoly: 8 },
    tetris: { url: '/audio/sfx/tetris.ogg', gain: 1.0, maxPoly: 2 },
    hold: { url: '/audio/sfx/hold.ogg', gain: 0.7, maxPoly: 2 },
    level_up: { url: '/audio/sfx/level_up.ogg', gain: 0.9, maxPoly: 1 },
    game_over: { url: '/audio/sfx/game_over.ogg', gain: 0.9, maxPoly: 1 },
    ui_click: { url: '/audio/sfx/ui_click.ogg', gain: 0.6, maxPoly: 6 }
  },
  music: {
    theme_main: { url: '/audio/music/theme_main.ogg', gain: 0.7, loopStart: 2.0, loopEnd: 66.0 },
    menu_ambient: { url: '/audio/music/menu_ambient.ogg', gain: 0.6, loop: true }
  }
}
```

## Integration Plan

- Boot:
  - Show audio state in Settings; call `resumeOnUserGesture()` on first input.
  - Preload SFX, begin decoding `theme_main`; start `menu_ambient` in menu.
- Play Scene:
  - On start: crossfade to `theme_main` if not already.
  - Subscribe to engine events and map to `playSfx` calls.
  - On pause: lower music by ~3 dB; restore on resume (or swap to menu track).
- Game Over:
  - Play `game_over`; stop music or crossfade to menu track.

Wiring concept:

- `AudioSystem` (web layer) subscribes to a `GameEvents` bus emitted by the engine/host.
- `SettingsStore` keeps audio prefs; `AudioSystem` listens and applies changes.

## Tests (Vitest)

- `AudioService.test.ts`:
  - Applies volume & mute correctly; persists and reloads state.
  - Enforces polyphony caps; ignores extra voices beyond max.
  - Crossfade ramps both tracks over configured duration.
  - Cooldown prevents rapid retrigger for the same SFX id.
- `WebAudioAdapter.test.ts`:
  - Schedules one‑shots and sets `playbackRate` detune within bounds (using a fake context).
  - Respects loop points for music nodes.
- `EventMapping.test.ts`:
  - Given mock engine events, calls expected `playSfx`/`playMusic` with correct ids.

Note: Use dependency injection to pass a `FakeAudioContext` for deterministic tests.

## Risks & Mitigations

- Autoplay restrictions: require a user gesture to start; surface a clear prompt.
- Clipping on stacked SFX: limiter on master, conservative default gains, polyphony caps.
- Latency on low‑end devices: predecode, short assets, avoid heavy processing.
- Over‑noisy mix: avoid move SFX by default; tweak gains; offer a quick mute.

## Milestones

M1 — Scaffolding

- Implement `AudioService` + `WebAudioAdapter` with buses and settings.
- Preload manifest, play one‑shots, play/stop music, crossfade.
- Unit tests for service behavior and mapping.

M2 — Game Integration

- Hook engine events to audio; wire settings UI; persist volumes.
- Ship initial SFX + one gameplay music loop.

M3 — Polish

- Adjust gains and detune ranges; refine loop points; add level up/game over cues.
- Optional: basic ducking on line clears/tetris; throttle chatty events.

Outcomes: a responsive, tasteful audio layer that enhances feedback without distraction, built on a modular service ready for future expansion (stems, FX, dynamic mixes).

