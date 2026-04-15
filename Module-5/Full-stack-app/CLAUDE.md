# CLAUDE.md — Notes for Claude Code

## Project

Minimal Next.js 15 + Prisma 7 + SQLite app. A single `Post` model (id, title, body, createdAt).

## Key conventions

- **Prisma client**: always import from `@/lib/prisma` (singleton, prevents connection leaks in dev).
- **Database adapter**: Prisma v7 requires an explicit adapter. We use `PrismaBetterSqlite3` from `@prisma/adapter-better-sqlite3`, constructed with `{ url: "file:..." }`. Do **not** add a `url` field to `prisma/schema.prisma`; the URL lives in `prisma.config.ts` (for CLI) and the adapter in `lib/prisma.ts` (for the runtime client).
- **Generated files**: `app/generated/prisma/` is gitignored. Run `npx prisma generate` after schema changes.
- **Migrations**: run `npx prisma migrate dev --name <name>` for schema changes.
- **No CSS framework**: styling is plain inline styles. Keep it simple.
- **No test suite** exists yet. If adding tests, prefer integration tests with a real SQLite test database.

## Common commands

```bash
npx prisma migrate dev --name <migration_name>   # create + apply migration
npx prisma generate                              # regenerate client after schema change
npx prisma studio                                # browse data
npm run dev                                      # start dev server
npm run build                                    # production build
```

## What NOT to do

- Do not add a `url` field to `prisma/schema.prisma` — Prisma v7 rejects it.
- Do not import directly from `@prisma/client` — use the generated output at `@/app/generated/prisma/client`.
- Do not over-engineer: no state management library, no extra abstractions.
