# module-6-ai-toolkit

Express + TypeScript REST API and MCP server for managing tasks and users.

## Quick start

```bash
npm install
JWT_SECRET=your-secret npm run dev   # http://localhost:3458
npm test                              # run test suite
npm run type-check                    # TypeScript check without emitting
npm run lint                          # Prettier format check
```

## Project layout

```
src/
  index.ts                  # App bootstrap, middleware wiring, graceful shutdown
  types.ts                  # Shared TypeScript interfaces (Task, User)
  middleware/
    auth.ts                 # JWT Bearer token verification → req.user
    errorHandler.ts         # AppError class + global error handler
    logger.ts               # Structured JSON logger + requestId middleware
  routes/
    tasks.ts                # CRUD for /api/tasks
    users.ts                # CRUD for /api/users
  utils/
    helpers.ts              # generateId, slugify, formatDate, isValidEmail
  mcp-env-config.ts         # MCP server exposing env-config tools over stdio
test/
  tasks.test.ts             # Supertest integration tests
.github/
  workflows/ci.yml          # CI: test → build → security (paths-filtered to this module)
```

## Environment variables

| Variable         | Required | Default                 | Description                           |
| ---------------- | -------- | ----------------------- | ------------------------------------- |
| `JWT_SECRET`     | yes      | —                       | Signs and verifies JWT tokens         |
| `PORT`           | no       | `3458`                  | HTTP listen port                      |
| `NODE_ENV`       | no       | `development`           | `production` strips stack traces      |
| `CORS_ORIGIN`    | no       | `http://localhost:3000` | Allowed CORS origin                   |
| `RATE_LIMIT_MAX` | no       | `100`                   | Max requests per 15-min window per IP |
| `LOG_LEVEL`      | no       | `info`                  | Logging verbosity                     |

`JWT_SECRET` must be set or every API request will return `500`. Use the MCP env-config tool (`npm run mcp`) to generate a `.env` file interactively.

## API

All `/api/*` routes require `Authorization: Bearer <token>`.

Every response includes a `requestId` field (also in the `X-Request-Id` response header) for log correlation.

### Tasks — `GET|POST /api/tasks`, `GET|PUT|DELETE /api/tasks/:id`

`GET /api/tasks` accepts optional query params `?status=todo|in-progress|done` and `?priority=low|medium|high`.

### Users — `GET|POST /api/users`, `GET /api/users/:id`

`POST /api/users` requires `email` (valid format) and `password` (min 8 chars). The `role` field is always set to `"member"` server-side — callers cannot self-assign admin.

Passwords are hashed with bcrypt (cost 12) and never returned in any response.

### Health check — `GET /health`

Unauthenticated. Returns `{ status: "ok", timestamp }`.

## Middleware stack (in order)

```
express.json()
requestIdMiddleware   → generates UUID, sets X-Request-Id header
requestLogger         → logs method/path/status/durationMs on response finish
authMiddleware        → verifies JWT (applied per-router, not globally)
[route handlers]
notFoundHandler       → 404 with requestId
errorHandler          → catch-all: AppError → warn log; unexpected → error log
```

## Error handling pattern

Throw `AppError` for expected failures — it carries a status code and surfaces a clean message to the client:

```ts
import { AppError } from "../middleware/errorHandler";

throw new AppError(403, "You do not have permission to do that");
```

Unexpected errors (uncaught throws) are caught by `errorHandler`, logged with full stack, and returned as `500 Internal server error` in production.

## Logging

All log output is newline-delimited JSON. Fields always present:

```json
{ "timestamp": "ISO-8601", "level": "info|warn|error|debug", "message": "..." }
```

Request log lines add: `requestId`, `method`, `path`, `status`, `durationMs`.

`info/warn/debug` → `stdout`. `error` → `stderr`.

## Authentication

`authMiddleware` reads `process.env.JWT_SECRET` at request time. Sign tokens with:

```ts
import jwt from "jsonwebtoken";
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET!,
);
```

Decoded payload is available as `req.user` (`{ id: string, role: string }`) in all protected route handlers.

## Testing

```bash
npm test              # single run
npm run test:watch    # watch mode
```

Tests set `process.env.JWT_SECRET = 'test-secret'` at the top of the file and generate tokens with `jwt.sign(...)`. The `resetTasks()` and `resetUsers()` exports restore in-memory state in `beforeEach`.

**Rule:** do not mock the in-memory store. Call `reset*()` functions instead so tests hit the real route logic.

## Known issues to fix before production

These are documented in-source and were identified in a security audit:

- `POST /api/tasks` and `PUT /api/tasks/:id` have no Zod input validation (SEC-005)
- `PUT /api/tasks/:id` spreads `req.body` directly — mass assignment risk (SEC-009)
- No CORS middleware wired up despite `CORS_ORIGIN` env var existing (SEC-008)
- No rate limiting wired up despite `RATE_LIMIT_MAX` env var existing (SEC-007)
- `generateId()` uses `Math.random()` — replace with `crypto.randomUUID()` (SEC-010)
- No `helmet` middleware for HTTP security headers (SEC-014)
- No login endpoint — tokens cannot be obtained via the API yet

## MCP server

`npm run mcp` starts the `env-config-mcp` server over stdio. It exposes two tools:

- `get_env_config_form` — returns an interactive HTML form for filling in env vars
- `apply_env_vars` — accepts a `vars` map and returns a formatted `.env` file string

Add to Claude Desktop via `.mcp.json` or `claude mcp add`.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main` that touches `Module-8/module-6-ai-toolkit/**`:

1. **Test** — lint → type-check → test with coverage
2. **Build** — `tsc` (runs after Test)
3. **Security** — `npm audit --audit-level=high` (runs in parallel with Build)
