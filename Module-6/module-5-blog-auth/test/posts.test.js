import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../src/server.js";

const prisma = new PrismaClient();

let authToken;
let testUserId;

// ─── Global setup ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Register the primary test user via the API (step 5.1)
  const authRes = await request(app).post("/api/auth/register").send({
    email: "alice@example.com",
    password: "testpassword",
  });
  authToken = authRes.body.token;
  testUserId = authRes.body.user.id;

  // Seed test posts owned by Alice
  await prisma.post.create({
    data: {
      id: 100,
      title: "Test Post One",
      content: "Content for test post one.",
      published: true,
      authorId: testUserId,
    },
  });

  await prisma.post.create({
    data: {
      id: 101,
      title: "Test Post Two (Draft)",
      content: "This draft should not appear in listings.",
      published: false,
      authorId: testUserId,
    },
  });

  await prisma.comment.create({
    data: {
      content: "A test comment",
      authorName: "Tester",
      postId: 100,
    },
  });
});

afterAll(async () => {
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// ─── Health ───────────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("should return ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ─── Public reads (no token required) ────────────────────────────────────────

describe("GET /api/posts", () => {
  it("should return only published posts", async () => {
    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Test Post One");
  });
});

describe("GET /api/posts/:id", () => {
  it("should return a post with its comments", async () => {
    const res = await request(app).get("/api/posts/100");
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Test Post One");
    expect(Array.isArray(res.body.comments)).toBe(true);
    expect(res.body.comments.length).toBe(1);
    expect(res.body.comments[0].authorName).toBe("Tester");
  });

  it("should return 404 for a non-existent post", async () => {
    const res = await request(app).get("/api/posts/9999");
    expect(res.status).toBe(404);
  });
});

// ─── Register (step 5.4) ──────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("should register a new user and return a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "newuser@example.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("newuser@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("should return 409 for a duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      password: "anypassword",
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already in use");
  });

  it("should return 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "password123" });
    expect(res.status).toBe(400);
  });

  it("should return 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "nopassword@example.com" });
    expect(res.status).toBe(400);
  });
});

// ─── Login (step 5.5) ─────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("should return a token on correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "testpassword",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("alice@example.com");
  });

  it("should return 401 on wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("should return 401 on unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });
});

// ─── Post write routes with auth (steps 5.2–5.3) ─────────────────────────────

describe("POST /api/posts", () => {
  it("should create a new post with a valid token", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "New Test Post",
        content: "Some content here.",
        published: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("New Test Post");
    expect(res.body.published).toBe(true);
    expect(res.body.authorId).toBe(testUserId);
  });

  it("should reject a post without a title", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ content: "Missing title" });
    expect(res.status).toBe(400);
  });
});

// ─── 401 on missing token (step 5.6) ─────────────────────────────────────────

describe("Auth — 401 on missing token", () => {
  it("POST /api/posts returns 401", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ title: "T", content: "C" });
    expect(res.status).toBe(401);
  });

  it("PUT /api/posts/:id returns 401", async () => {
    const res = await request(app)
      .put("/api/posts/100")
      .send({ title: "Updated" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/posts/:id returns 401", async () => {
    const res = await request(app).delete("/api/posts/100");
    expect(res.status).toBe(401);
  });

  it("POST /api/posts/:id/comments returns 401", async () => {
    const res = await request(app)
      .post("/api/posts/100/comments")
      .send({ content: "Hi", authorName: "Bob" });
    expect(res.status).toBe(401);
  });
});

// ─── 403 ownership enforcement (step 5.7) ────────────────────────────────────

describe("Auth — ownership enforcement", () => {
  let bobToken;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "bob@example.com",
      password: "bobpassword",
    });
    bobToken = res.body.token;
  });

  it("PUT /api/posts/100 returns 403 for wrong owner", async () => {
    const res = await request(app)
      .put("/api/posts/100")
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ title: "Hacked" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Not authorized to edit this post");
  });

  it("DELETE /api/posts/100 returns 403 for wrong owner", async () => {
    const res = await request(app)
      .delete("/api/posts/100")
      .set("Authorization", `Bearer ${bobToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Not authorized to delete this post");
  });

  it("PUT /api/posts/100 returns 200 for correct owner", async () => {
    const res = await request(app)
      .put("/api/posts/100")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Updated by Alice" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated by Alice");
  });

  it("DELETE /api/posts/100 returns 200 for correct owner", async () => {
    const res = await request(app)
      .delete("/api/posts/100")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Post deleted");
  });
});
