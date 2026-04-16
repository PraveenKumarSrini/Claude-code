# Authentication Specification — Blog API

> **Status:** Approved for implementation
> **Last updated:** 2026-04-15
> **Stack:** Node.js · Express · Prisma · SQLite · JWT · bcryptjs

---

## 1. Requirements

### User Stories

| ID | As a… | I want to… | So that… |
|----|-------|-----------|---------|
| US-1 | Visitor | Register with email and password | I can create an account |
| US-2 | Registered user | Log in and receive a token | I can access protected features |
| US-3 | Authenticated user | Create blog posts | I can publish my writing |
| US-4 | Authenticated user | Edit my own posts | I can correct or update content |
| US-5 | Authenticated user | Delete my own posts | I can remove content I no longer want |
| US-6 | Authenticated user | Post comments on published posts | I can engage with other content |
| US-7 | Visitor | Read all published posts and their comments | I can browse the blog without an account |
| US-8 | Authenticated user | Be prevented from editing or deleting another user's post | My content is protected from tampering |

### Acceptance Criteria

**US-1 — Register**
- `POST /api/auth/register` with valid `{ email, password }` returns `201` with a JWT token and `{ id, email }`
- Duplicate email returns `409 { error: "Email already in use" }`
- Missing `email` or `password` returns `400`
- Password is never returned in any response

**US-2 — Login**
- `POST /api/auth/login` with correct credentials returns `200` with a JWT token and `{ id, email }`
- Wrong password or unknown email returns `401 { error: "Invalid credentials" }` (same message for both — no user enumeration)
- Token expires after 24 hours

**US-3 — Create post**
- `POST /api/posts` without a token returns `401`
- With a valid token returns `201` with the created post; response includes `authorId`
- Token payload's `id` is stored as the post's `authorId`

**US-4 — Edit post**
- `PUT /api/posts/:id` without a token returns `401`
- With a valid token but wrong owner returns `403 { error: "Not authorized to edit this post" }`
- With the correct owner's token updates and returns the post

**US-5 — Delete post**
- `DELETE /api/posts/:id` without a token returns `401`
- With a valid token but wrong owner returns `403 { error: "Not authorized to delete this post" }`
- With the correct owner's token deletes and returns `{ message: "Post deleted" }`

**US-6 — Comment**
- `POST /api/posts/:id/comments` without a token returns `401`
- With a valid token creates and returns the comment
- `authorName` is still a required body field (display name)

**US-7 — Public reads**
- `GET /api/posts` and `GET /api/posts/:id` return data with no token required
- No change to response shape for these endpoints

**US-8 — Ownership protection**
- A user cannot edit or delete a post they did not create, regardless of token validity

---

## 2. Technical Design

### Data Model

**New: `User` model**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String              // bcrypt hash, never returned in responses
  createdAt DateTime @default(now())
  posts     Post[]
}
```

**Modified: `Post` model** — add required `authorId`

```prisma
model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String
  published Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  comments  Comment[]
  authorId  Int                             // required — no anonymous posts
  author    User      @relation(fields: [authorId], references: [id])
}
```

`Comment` model — **unchanged** (existing `authorName` String field stays; auth gate is added at the route level only)

---

### API Contracts

#### Auth endpoints (new)

**`POST /api/auth/register`**

```
Request body:  { email: string, password: string }
Success 201:   { token: string, user: { id: number, email: string } }
Error 400:     { error: "Email and password are required" }
Error 409:     { error: "Email already in use" }
```

**`POST /api/auth/login`**

```
Request body:  { email: string, password: string }
Success 200:   { token: string, user: { id: number, email: string } }
Error 400:     { error: "Email and password are required" }
Error 401:     { error: "Invalid credentials" }
```

#### Modified post endpoints

| Method | Path | Auth required | Ownership check | Change from current |
|--------|------|:---:|:---:|---|
| GET | `/api/posts` | No | No | None |
| GET | `/api/posts/:id` | No | No | None |
| POST | `/api/posts` | **Yes** | — | Added auth; `authorId` set from token |
| PUT | `/api/posts/:id` | **Yes** | **Yes** | Added auth + 403 if wrong owner |
| DELETE | `/api/posts/:id` | **Yes** | **Yes** | Added auth + 403 if wrong owner |
| POST | `/api/posts/:id/comments` | **Yes** | — | Added auth |

**Token format:** Standard JWT in `Authorization: Bearer <token>` header. Payload: `{ id, email, iat, exp }`.

---

### Middleware

**`requireAuth(req, res, next)`**

Applied per-route (not globally). Logic:

1. Read `Authorization` header — if missing or not `Bearer ...` → `401`
2. Extract token, call `jwt.verify(token, JWT_SECRET)`
3. On verification failure (expired, tampered) → `401`
4. On success → attach decoded payload to `req.user`, call `next()`

```
JWT_SECRET source: process.env.JWT_SECRET ?? 'dev-secret'
Token expiry:      24h (set at sign time)
```

**Ownership check** — inline in each write handler (not a separate middleware):
```
if (existing.authorId !== req.user.id) → 403
```

---

### Dependencies to add

| Package | Version | Purpose |
|---------|---------|---------|
| `jsonwebtoken` | latest | Sign and verify JWTs |
| `bcryptjs` | latest | Hash and compare passwords (pure JS, no native build needed) |

No other new dependencies.

---

## 3. Implementation Plan

Organized into 5 phases. Complete each phase fully and verify before moving to the next. Do not skip ahead.

---

### Phase 1 — Project Setup

**Goal:** Add new dependencies and confirm the project still starts cleanly.

- [ ] **1.1** Install auth packages
  ```bash
  npm install jsonwebtoken bcryptjs
  ```
- [ ] **1.2** Confirm packages appear in `package.json` under `dependencies`
- [ ] **1.3** Start the server and confirm it still starts without errors
  ```bash
  npm start
  # Expected: "Blog API running on http://localhost:3456"
  ```

**Phase 1 gate:** `GET /health` returns `{ "status": "ok" }` — no regressions.

---

### Phase 2 — Database Layer

**Goal:** Introduce the `User` model, link posts to users, and reset the database with updated seed data.

- [ ] **2.1** Add `User` model to `prisma/schema.prisma`
  ```prisma
  model User {
    id        Int      @id @default(autoincrement())
    email     String   @unique
    password  String
    createdAt DateTime @default(now())
    posts     Post[]
  }
  ```
- [ ] **2.2** Add `authorId Int` and `author User` relation to the `Post` model in `prisma/schema.prisma`
  ```prisma
  authorId  Int
  author    User  @relation(fields: [authorId], references: [id])
  ```
- [ ] **2.3** Update `prisma/seed.js` — three changes:
  - Add `await prisma.user.deleteMany()` at the top of the cleanup block (before posts/comments)
  - Add `const bcrypt = require('bcryptjs')` at the top of the file
  - Create a seed user before any posts:
    ```javascript
    const seedUser = await prisma.user.create({
      data: {
        email: 'seed@example.com',
        password: await bcrypt.hash('password123', 10),
      },
    });
    ```
  - Add `authorId: seedUser.id` to every `prisma.post.create()` call
- [ ] **2.4** Run the database reset (drops DB, applies new schema, re-runs seed)
  ```bash
  npx prisma migrate reset
  ```
  Expected output: migration applied + seed output showing user and posts created.
- [ ] **2.5** Verify the schema applied correctly
  ```bash
  npx prisma studio
  # Open the User table — seed@example.com should appear
  # Open the Post table — authorId column should be populated
  ```

**Phase 2 gate:** Prisma Studio shows a `User` row and all `Post` rows have `authorId` set. `GET /api/posts` still returns published posts.

---

### Phase 3 — Auth Endpoints

**Goal:** Build registration, login, and the `requireAuth` middleware. No route protection yet — that comes in Phase 4.

- [ ] **3.1** Add requires and constants at the top of `src/server.js`
  ```javascript
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
  ```
- [ ] **3.2** Add `requireAuth` middleware function (after `app.use(express.json())`)
  - Read `Authorization` header; reject with `401` if missing or not `Bearer ...`
  - Call `jwt.verify(token, JWT_SECRET)`; reject with `401` on any error
  - On success, set `req.user = decoded` and call `next()`
- [ ] **3.3** Add `POST /api/auth/register` endpoint
  - Validate `email` and `password` present → `400` if missing
  - Check for existing user → `409` if duplicate email
  - Hash password: `await bcrypt.hash(password, 10)`
  - Create user in DB
  - Sign token: `jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '24h' })`
  - Return `201 { token, user: { id, email } }` — **never include `password`**
- [ ] **3.4** Add `POST /api/auth/login` endpoint
  - Validate `email` and `password` present → `400` if missing
  - Fetch user by email; if not found → `401 { error: "Invalid credentials" }`
  - `await bcrypt.compare(password, user.password)`; if false → same `401`
  - Sign and return `200 { token, user: { id, email } }`

**Phase 3 gate:** Manual test:
```bash
# Register
curl -s -X POST http://localhost:3456/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"secret123"}' | jq .
# → 201 with token

# Wrong password login
curl -s -X POST http://localhost:3456/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"wrong"}' | jq .
# → 401 Invalid credentials
```

---

### Phase 4 — Route Protection & Ownership

**Goal:** Lock down write routes and enforce that users can only modify their own posts.

- [ ] **4.1** Protect `POST /api/posts`
  - Add `requireAuth` as second argument to the route
  - Replace hardcoded post creation with `authorId: req.user.id` in the `data` object
  - Remove any `authorId` from `req.body` — always use the token value
- [ ] **4.2** Protect `PUT /api/posts/:id`
  - Add `requireAuth` as second argument
  - After fetching `existing`, add ownership check:
    ```javascript
    if (existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }
    ```
  - The update logic below the check is unchanged
- [ ] **4.3** Protect `DELETE /api/posts/:id`
  - Add `requireAuth` as second argument
  - Same ownership check pattern as PUT, with message `'Not authorized to delete this post'`
- [ ] **4.4** Protect `POST /api/posts/:id/comments`
  - Add `requireAuth` as second argument
  - No ownership check needed — any authenticated user can comment
  - `authorName` body field remains required and unchanged

**Phase 4 gate:** Manual test all four scenarios:
```bash
# No token → 401
curl -s -X POST http://localhost:3456/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"T","content":"C"}' | jq .

# Valid token → 201 with authorId set
curl -s -X POST http://localhost:3456/api/posts \
  -H "Authorization: Bearer <alice-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Alice Post","content":"Hello","published":true}' | jq .

# Wrong owner → 403
curl -s -X DELETE http://localhost:3456/api/posts/<alice-post-id> \
  -H "Authorization: Bearer <bob-token>" | jq .

# Public read still works without token → 200
curl -s http://localhost:3456/api/posts | jq .
```

---

### Phase 5 — Tests

**Goal:** Update existing tests for auth and add full coverage for new behaviour.

- [ ] **5.1** Update `beforeAll` in `test/posts.test.js`
  - Add `await prisma.user.deleteMany()` to the cleanup block
  - Register a test user via the API and capture `authToken` and `testUserId`:
    ```javascript
    const authRes = await request(app).post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'testpassword' });
    authToken = authRes.body.token;
    testUserId = authRes.body.user.id;
    ```
  - Add `authorId: testUserId` to both `prisma.post.create()` calls (ids 100 and 101)
- [ ] **5.2** Update `afterAll` — add `await prisma.user.deleteMany()`
- [ ] **5.3** Fix existing `POST /api/posts` test — add auth header:
  ```javascript
  await request(app).post('/api/posts')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ ... })
  ```
- [ ] **5.4** Add `describe('POST /api/auth/register')` tests
  - Returns `201` with `token` and `user.email`
  - Returns `409` on duplicate email
  - Returns `400` when `email` or `password` is missing
- [ ] **5.5** Add `describe('POST /api/auth/login')` tests
  - Returns `200` with token on correct credentials
  - Returns `401` on wrong password
  - Returns `401` on unknown email
- [ ] **5.6** Add `describe('Auth — 401 on missing token')` tests
  - `POST /api/posts` → `401`
  - `PUT /api/posts/100` → `401`
  - `DELETE /api/posts/100` → `401`
  - `POST /api/posts/100/comments` → `401`
- [ ] **5.7** Add `describe('Auth — 403 ownership enforcement')` tests
  - Register a second user (`bob@example.com`) in the describe block; capture token
  - `PUT /api/posts/100` with Bob's token → `403`
  - `DELETE /api/posts/100` with Bob's token → `403`
  - `PUT /api/posts/100` with Alice's (correct owner) token → `200`
  - `DELETE /api/posts/100` with Alice's token → `200`
- [ ] **5.8** Run full test suite and confirm zero failures
  ```bash
  npm test
  ```

---

## 4. Scope Boundaries

### What we will NOT build

| Feature | Reason excluded |
|---------|----------------|
| Token refresh / refresh tokens | Out of scope for this exercise; 24h expiry is acceptable |
| Logout / token blocklist | Stateless JWTs can't be invalidated server-side without a blocklist store (Redis etc.) — not in scope |
| Password reset / forgot password | Requires email infrastructure; out of scope |
| Email verification on register | Same — requires email delivery |
| Role-based access control (admin, editor) | Single-role system is sufficient for this app |
| Rate limiting on login | No real users; appropriate for production but overkill here |
| `dotenv` / `.env` file | `process.env.JWT_SECRET || 'dev-secret'` is sufficient for dev |
| argon2 password hashing | Requires native build tools on Linux; bcryptjs is adequate for this use case |
| Comment ownership (edit/delete own comments) | Comments are immutable in the current model; no update/delete comment route exists |
| Pagination or search | Unrelated to auth |
| HTTPS / TLS | Infrastructure concern, out of scope for app layer |

---

## 5. Success Criteria

The implementation is complete when all of the following pass.

### Automated tests

- [ ] `npm test` exits with zero failures
- [ ] `POST /api/auth/register` → `201` with token
- [ ] `POST /api/auth/register` (duplicate email) → `409`
- [ ] `POST /api/auth/login` (correct credentials) → `200` with token
- [ ] `POST /api/auth/login` (wrong password) → `401`
- [ ] `POST /api/posts` (no token) → `401`
- [ ] `POST /api/posts` (valid token) → `201` with `authorId` set
- [ ] `PUT /api/posts/:id` (no token) → `401`
- [ ] `PUT /api/posts/:id` (wrong owner) → `403`
- [ ] `PUT /api/posts/:id` (correct owner) → `200`
- [ ] `DELETE /api/posts/:id` (no token) → `401`
- [ ] `DELETE /api/posts/:id` (wrong owner) → `403`
- [ ] `DELETE /api/posts/:id` (correct owner) → `200`
- [ ] `POST /api/posts/:id/comments` (no token) → `401`
- [ ] `GET /api/posts` (no token) → `200` (public, unchanged)
- [ ] `GET /api/posts/:id` (no token) → `200` (public, unchanged)

### Manual smoke test

```bash
# 1. Register a user
curl -s -X POST http://localhost:3456/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"secret123"}' | jq .

# 2. Login with wrong password → should return 401
curl -s -X POST http://localhost:3456/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"wrong"}' | jq .

# 3. Create a post (use token from step 1)
curl -s -X POST http://localhost:3456/api/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello World","content":"My first post.","published":true}' | jq .

# 4. Register a second user, try to delete Alice's post → should return 403
curl -s -X DELETE http://localhost:3456/api/posts/<post-id> \
  -H "Authorization: Bearer <bob-token>"

# 5. Read posts without token → should return 200
curl -s http://localhost:3456/api/posts | jq .
```

### Invariants (must hold at all times)

- Password hashes are never present in any API response
- `req.user` is only set by `requireAuth` after successful JWT verification — never trust client-supplied user IDs on protected routes
- The `authorId` field on `Post` is always set from the JWT payload, never from the request body
