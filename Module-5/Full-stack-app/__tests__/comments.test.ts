import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

// ---------------------------------------------------------------------------
// Test database — isolated from dev.db
// ---------------------------------------------------------------------------

const TEST_DB = path.resolve(process.cwd(), "test.db");

// Replace the production Prisma singleton with one that points to test.db.
// vi.mock is hoisted before all imports, so the route module picks it up.
vi.mock("@/lib/prisma", async () => {
  const { PrismaClient } = await import("../app/generated/prisma/client");
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  const pathMod = await import("path");
  return {
    default: new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: `file:${pathMod.resolve(process.cwd(), "test.db")}`,
      }),
    }),
  };
});

import { GET, POST } from "../app/api/posts/[id]/comments/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Bootstrap tables from the same DDL as the migrations. */
function setupDb() {
  const db = new Database(TEST_DB);
  db.exec(`
    CREATE TABLE IF NOT EXISTS "Post" (
      "id"        INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
      "title"     TEXT     NOT NULL,
      "body"      TEXT     NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "Comment" (
      "id"         INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
      "authorName" TEXT     NOT NULL,
      "body"       TEXT     NOT NULL,
      "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "postId"     INTEGER  NOT NULL,
      CONSTRAINT "Comment_postId_fkey"
        FOREIGN KEY ("postId") REFERENCES "Post" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
    PRAGMA foreign_keys = ON;
  `);
  db.close();
}

/** Insert a Post row directly and return its id. */
function insertPost(title = "Test Post", body = "Test body"): number {
  const db = new Database(TEST_DB);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO "Post" ("title", "body", "createdAt") VALUES (?, ?, ?)')
    .run(title, body, new Date().toISOString());
  db.close();
  return lastInsertRowid as number;
}

/** Wipe all rows between tests. */
function clearTables() {
  const db = new Database(TEST_DB);
  db.exec('DELETE FROM "Comment"; DELETE FROM "Post";');
  db.close();
}

/** Build a POST Request with a JSON body. */
function postRequest(payload: unknown): Request {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Build the route context expected by Next.js dynamic handlers. */
function routeCtx(id: string | number) {
  return { params: Promise.resolve({ id: String(id) }) };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(() => setupDb());
afterEach(() => clearTables());
afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

// ---------------------------------------------------------------------------
// POST /api/posts/:id/comments
// ---------------------------------------------------------------------------

describe("POST /api/posts/:id/comments", () => {
  it("creates a comment and returns 201 with the new record", async () => {
    const postId = insertPost();

    const res = await POST(
      postRequest({ authorName: "Alice", body: "Great post!" }),
      routeCtx(postId),
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toMatchObject({
      authorName: "Alice",
      body: "Great post!",
      postId,
    });
    expect(data.id).toBeDefined();
    expect(data.createdAt).toBeDefined();
  });

  it("trims whitespace from authorName and body", async () => {
    const postId = insertPost();

    const res = await POST(
      postRequest({ authorName: "  Bob  ", body: "  Hello world  " }),
      routeCtx(postId),
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.authorName).toBe("Bob");
    expect(data.body).toBe("Hello world");
  });

  it("returns 400 when body is an empty string", async () => {
    const postId = insertPost();

    const res = await POST(
      postRequest({ authorName: "Alice", body: "" }),
      routeCtx(postId),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "authorName and body are required" });
  });

  it("returns 400 when body is whitespace only", async () => {
    const postId = insertPost();

    const res = await POST(
      postRequest({ authorName: "Alice", body: "   " }),
      routeCtx(postId),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "authorName and body are required" });
  });

  it("returns 400 when authorName is missing", async () => {
    const postId = insertPost();

    const res = await POST(
      postRequest({ body: "A comment without a name" }),
      routeCtx(postId),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "authorName and body are required" });
  });

  it("returns 400 for a non-numeric postId", async () => {
    const res = await POST(
      postRequest({ authorName: "Alice", body: "Hello" }),
      routeCtx("not-a-number"),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid post id" });
  });

  it("returns 404 when the post does not exist", async () => {
    const res = await POST(
      postRequest({ authorName: "Alice", body: "Hello" }),
      routeCtx(99999),
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Post not found" });
  });
});

// ---------------------------------------------------------------------------
// GET /api/posts/:id/comments
// ---------------------------------------------------------------------------

describe("GET /api/posts/:id/comments", () => {
  it("returns an empty array for a post with no comments", async () => {
    const postId = insertPost();

    const res = await GET(new Request("http://localhost"), routeCtx(postId));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns all comments that belong to the given post", async () => {
    const postId = insertPost();
    await POST(postRequest({ authorName: "Alice", body: "First" }), routeCtx(postId));
    await POST(postRequest({ authorName: "Bob", body: "Second" }), routeCtx(postId));

    const res = await GET(new Request("http://localhost"), routeCtx(postId));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
    const names = data.map((c: { authorName: string }) => c.authorName);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
  });

  it("does not return comments from a different post", async () => {
    const postA = insertPost("Post A", "body A");
    const postB = insertPost("Post B", "body B");
    await POST(postRequest({ authorName: "Alice", body: "On A" }), routeCtx(postA));
    await POST(postRequest({ authorName: "Bob", body: "On B" }), routeCtx(postB));

    const res = await GET(new Request("http://localhost"), routeCtx(postA));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].authorName).toBe("Alice");
  });

  it("returns 400 for a non-numeric postId", async () => {
    const res = await GET(new Request("http://localhost"), routeCtx("bad-id"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid post id" });
  });

  it("returns 404 when the post does not exist", async () => {
    const res = await GET(new Request("http://localhost"), routeCtx(99999));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Post not found" });
  });
});
