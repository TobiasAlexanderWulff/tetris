# Tetris

A modern, guideline-inspired Tetris built with TypeScript, React, Vite, and Canvas 2D.

## Features

- Guideline-inspired gameplay: SRS rotation, 7-bag randomizer, hold, ghost piece, next queue, lock delay, and level-based gravity.
- Scoring with singles, doubles, triples, Tetrises, combos, back-to-back bonuses, and soft/hard-drop points.
- Keyboard, mouse, and touch controls (including tap, drag, soft drop, hard drop, and hold gestures).
- Configurable DAS/ARR, key bindings, 180° rotation, themes, animations, and audio volumes.
- Music and SFX driven by game events through a small audio service.
- Local highscores with ranking, export/import, and migrations.
- Responsive layout for desktop, mobile, and landscape play.

## Tech Stack

- TypeScript (strict), React 18, Vite
- Canvas 2D renderer with HiDPI scaling
- Web Audio API
- pnpm workspaces
- Vitest + Testing Library, ESLint, Prettier
- GitHub Actions for lint, typecheck, and tests

## Project Structure

```
packages/
  core/   # Framework-agnostic game engine (board, pieces, SRS, scoring)
  web/    # React app, canvas renderer, input, audio, UI, highscores
```

`@tetris/core` contains the pure game logic and has no DOM dependencies. `@tetris/web` wires the engine to the browser, rendering, input sources, and UI.

## Commands

```bash
pnpm install
pnpm dev          # start the Vite dev server
pnpm build        # build the web app and core package
pnpm preview      # preview the production build
pnpm test         # run core and web tests
pnpm run typecheck
pnpm run lint
pnpm run format
```

## Development Workflow

- Development happens on the `dev` branch.
- `main` is the production branch and triggers the deployment build.
- Keep changes on `dev` until they are ready to be merged into `main`.
