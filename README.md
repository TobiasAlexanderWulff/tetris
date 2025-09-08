Tetris — Monorepo (M0)

Commands (pnpm)

- dev: `pnpm run dev` (starts Vite in `packages/web`)
- build: `pnpm run build`
- test: `pnpm test`
- typecheck: `pnpm run typecheck`
- lint: `pnpm run lint`

Notes

- Uses npm workspaces: `packages/core` (engine scaffold) and `packages/web` (Vite + React app).
- Web app currently renders a full-screen canvas with an FPS counter.
- CI runs lint, typecheck, and tests using pnpm.
