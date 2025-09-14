# Global Leaderboard Plan

## Goals

- Server-side storage for highscores with a global, public leaderboard.
- Prompt user for a name on first Game Over; persist name client-side for reuse.
- Minimal UI changes: reuse existing overlays/tables; only extend to support username and global listing.
- Graceful fallback when server is unavailable (local-only highscores continue to work).

## Non-Goals

- Full anti-cheat or cryptographic score verification.
- Account system, authentication, or social features.
- Major UI redesign; keep current look and flow.

## Architecture Overview

- Server: `packages/server` (Node + Express or similar) with REST endpoints.
- Client: `packages/web` adds a remote highscore client and username storage.
- Data: persistent DB (SQLite for dev; Postgres-compatible for prod). Simple schema optimized for top-N queries.
- Config: API base URL via `VITE_API_BASE_URL` with sane defaults.

## Data Model

- scores
  - `id` (uuid)
  - `username` (string, 3–16, sanitized)
  - `score` (int, indexed desc)
  - `level` (int)
  - `lines` (int)
  - `created_at` (timestamp, indexed desc)
  - `client_id` (string; hash/uuid for coarse duplicate detection)

Notes:
- Index `(score desc, created_at desc)` for top queries.
- Optional: partial unique index to keep top-1 per `client_id` per day to limit spam (configurable).

## API Endpoints

- `POST /api/scores`
  - Body: `{ username, score, level, lines, clientId }`
  - Returns: `{ id, accepted: true, rank }`
  - Validation: username length/charset; score/level/lines sanity; rate-limit by IP and `clientId`.

- `GET /api/leaderboard?limit=50`
  - Returns: `{ items: [{ username, score, level, lines, createdAt }], total }`
  - Default limit: 10; max: 100.

- `GET /api/health` (ops)

## Client Changes (packages/web)

- Username persistence
  - Add `nameStorage`: read/write to `localStorage` with schema + validation.
  - First Game Over: if name missing, show inline input on `GameOverOverlay` and persist on confirm.
  - Autofill on later Game Overs using stored name.

- Remote highscore client
  - `remoteClient.ts`: wrappers for `POST /api/scores` and `GET /api/leaderboard` with zod-style runtime validation.
  - Submit score after game ends if username exists; if not, submit once user confirms name.
  - Resilient: network failures don’t block local save; surface toast, keep playing.

- UI integration (minimal)
  - `GameOverOverlay.tsx`: add a small name input row only when name is not set. Keep layout intact.
  - `HighscoreTable.tsx`: add a toggle or stacked sections: Global Top N above Local. Reuse existing table component.
  - Loading/empty/error states for global table; keep styles consistent.

- Config
  - `VITE_API_BASE_URL` (default `""` meaning same origin `/api`).
  - Add a feature flag `VITE_GLOBAL_LEADERBOARD=on|off` to gate remote features, default `on`.

## Server Implementation (packages/server)

- Stack: Node 20, Express, CORS, helmet, rate-limiter, pino for logs.
- Persistence: SQLite via Prisma for dev; configure Postgres for production.
- Validation: zod schemas shared or duplicated with client types.
- Security: sanitize input; CORS allowlist; simple rate-limits; basic heuristic score caps.
- Deployment: containerized (Dockerfile). Expose `/api/*` behind reverse proxy. 

## Validation & Anti-Cheat (lightweight)

- Sanity checks: level in expected range; lines non-negative; score within plausible max for session length (configurable cap).
- Rate limiting per IP and `clientId` on submissions.
- Optional: throttle multiple submissions within a short window; keep best of N.

## Testing Strategy

- Client unit tests
  - `nameStorage`: persists, validates, migrates.
  - `remoteClient`: request/response validation, error handling (mock fetch).
  - `GameOverOverlay`: name prompt appears only when needed; submit flow.
  - `HighscoreTable`: renders global vs local; loading/error states.

- Client integration tests
  - Submit-after-name flow: game over without name → prompt → set → submit → table updates.

- Server tests
  - Endpoint validation: accepts sane payloads, rejects invalid.
  - Leaderboard ordering, limits, and pagination.
  - Rate limiting behavior.

## Rollout Plan

1) Land server locally with SQLite; wire basic endpoints.
2) Add client feature flag; integrate remote client with graceful fallback.
3) Add UI prompt + autofill; keep local highscores intact.
4) Add global table view; default limit 10.
5) Add tests; stabilize; docs.
6) Deploy server; configure `VITE_API_BASE_URL` in prod.

## File/Module Plan

- Client
  - Add: `packages/web/src/profile/nameStorage.ts`
  - Add: `packages/web/src/highscore/remoteClient.ts`
  - Update: `packages/web/src/ui/GameOverOverlay.tsx`
  - Update: `packages/web/src/ui/HighscoreTable.tsx`
  - Update: `packages/web/src/state/settings.tsx` (optional: surface name in Settings)
  - Add tests mirroring existing test structure under `packages/web/src/**.test.ts[x]`

- Server
  - Add: `packages/server/src/index.ts` (Express app)
  - Add: `packages/server/src/routes/scores.ts`
  - Add: `packages/server/src/db/*` (Prisma schema + client)
  - Add: `packages/server/package.json`, `tsconfig.json`, `Dockerfile`

## Minimal UI Changes

- Game Over overlay: one compact input (placeholder “Enter name”) with confirm button when name is missing. Persist and submit.
- Highscore table: add a Global section above existing Local, same columns. Small toggle label if space is tight.
- Keep typography, colors, spacing consistent with current theme.

## Open Questions

- Do we cap the number of scores per user/day to reduce spam?
- Should we allow users to update their displayed name later (via Settings)?
- What is the target deployment environment for the server (render/vercel/fly/self-hosted)?

## Work Breakdown (Tasks)

1. Server scaffold with `/api/health`.
2. DB schema + migrations (`scores`).
3. Implement `POST /api/scores` with validation + rate limit.
4. Implement `GET /api/leaderboard` with sorting/limits.
5. Client `nameStorage` + tests.
6. Client `remoteClient` + tests.
7. Integrate submit-on-gameover; fallback on failure.
8. Add name prompt to `GameOverOverlay` (conditional render) + tests.
9. Extend `HighscoreTable` to show Global + states + tests.
10. Env/config wiring and docs.
11. E2E happy-path flow test locally.
12. Deploy server, point client to prod URL.

## Notes for Future Iterations

- Add pagination to leaderboard; country flags (via IP geolocation) is out of scope.
- Consider WebSocket push for live leaderboard updates.
- Explore server-side score verification only if we can transmit event streams (large scope change).

