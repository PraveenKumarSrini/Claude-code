# Full Stack App — Next.js + Prisma + SQLite

A minimal full-stack Next.js application with a Post model backed by SQLite via Prisma.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Prisma 7** (ORM)
- **SQLite** (via `better-sqlite3`)

## Features

- List all posts, ordered newest first
- Create new posts with title and body
- Server-rendered page with a client-side form

## Getting Started

```bash
# Install dependencies
npm install

# Apply database migrations and generate Prisma client
npx prisma migrate dev
npx prisma generate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
app/
  api/posts/route.ts   # GET and POST endpoints
  generated/prisma/    # Prisma-generated client (gitignored)
  page.tsx             # Server component — fetches and lists posts
  PostForm.tsx         # Client component — create post form
lib/
  prisma.ts            # PrismaClient singleton
prisma/
  schema.prisma        # Post model definition
  migrations/          # Migration history
dev.db                 # SQLite database (gitignored, at project root)
```

## API

| Method | Path        | Description      |
|--------|-------------|------------------|
| GET    | /api/posts  | List all posts   |
| POST   | /api/posts  | Create a post    |

### POST body

```json
{ "title": "string", "body": "string" }
```
