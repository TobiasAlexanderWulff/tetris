Tetris — Monorepo (M0)

Commands

- dev: `npm run dev` (starts Vite in `packages/web`)
- build: `npm run build`
- test: `npm test`
- typecheck: `npm run typecheck`
- lint: `npm run lint`

Notes

- Uses npm workspaces: `packages/core` (engine scaffold) and `packages/web` (Vite + React app).
- Web app currently renders a full-screen canvas with an FPS counter.
- CI runs lint, typecheck, and tests.

