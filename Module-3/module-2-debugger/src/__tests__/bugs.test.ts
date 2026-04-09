import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestDb,
  createUser,
  createPost,
  getUserWithPostCount,
  getAllPostsWithAuthors,
} from "../db";

// Each test gets a fresh in-memory database — no leftover state between tests.
beforeEach(() => {
  createTestDb();
});

// ---------------------------------------------------------------------------
// Bug #1 — createUser crashed at runtime
//
// Root cause: result.lastInsertRowid was not cast to number before being
// passed to getUserById, causing the SELECT to receive undefined and return
// null. The fix casts lastInsertRowid as number.
// ---------------------------------------------------------------------------
describe("Bug #1 — createUser", () => {
  it("returns the newly created user with an id", () => {
    const user = createUser("Alice", "alice@test.com") as any;

    expect(user).not.toBeNull();
    expect(user.id).toBeDefined();
    expect(typeof user.id).toBe("number");
  });

  it("returned user has the correct name and email", () => {
    const user = createUser("Bob", "bob@test.com") as any;

    expect(user.name).toBe("Bob");
    expect(user.email).toBe("bob@test.com");
  });
});

// ---------------------------------------------------------------------------
// Bug #2 — getUserWithPostCount returned the total post count for all users
//
// Root cause: the COUNT query was missing the WHERE authorId = ? filter,
// so every user appeared to have the same (global) count.
// ---------------------------------------------------------------------------
describe("Bug #2 — getUserWithPostCount", () => {
  it("counts only the posts belonging to the requested user", () => {
    const u1 = createUser("User One", "one@test.com") as any;
    const u2 = createUser("User Two", "two@test.com") as any;

    createPost("Post A", "body", u1.id);
    createPost("Post B", "body", u1.id);

    createPost("Post C", "body", u2.id);
    createPost("Post D", "body", u2.id);
    createPost("Post E", "body", u2.id);

    const stats1 = getUserWithPostCount(u1.id) as any;
    const stats2 = getUserWithPostCount(u2.id) as any;

    // Without the fix both would return 5 (total posts).
    expect(stats1.postCount).toBe(2);
    expect(stats2.postCount).toBe(3);
  });

  it("returns postCount 0 when the user has no posts", () => {
    const user = createUser("Lurker", "lurker@test.com") as any;
    const stats = getUserWithPostCount(user.id) as any;

    expect(stats.postCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Bug #3 — getAllPostsWithAuthors used N+1 queries
//
// Root cause: the original implementation fetched all posts, then issued a
// separate SELECT for every post's author (1 + N queries). The fix uses a
// single LEFT JOIN query. The response includes queryCount to make this
// observable.
// ---------------------------------------------------------------------------
describe("Bug #3 — getAllPostsWithAuthors (N+1)", () => {
  it("fetches all posts with author data using exactly 1 query", () => {
    const author = createUser("Author", "author@test.com") as any;
    createPost("Post 1", "body one", author.id);
    createPost("Post 2", "body two", author.id);

    const { queryCount } = getAllPostsWithAuthors();

    // N+1 would give queryCount = 3 (1 + 2 posts). Fixed version = 1.
    expect(queryCount).toBe(1);
  });

  it("includes author name on each post", () => {
    const author = createUser("Jane Doe", "jane@test.com") as any;
    createPost("My Post", "hello", author.id);

    const { posts } = getAllPostsWithAuthors();

    expect(posts).toHaveLength(1);
    expect(posts[0].author).toMatchObject({ id: author.id, name: "Jane Doe" });
  });

  it("returns an empty array when there are no posts", () => {
    const { posts, queryCount } = getAllPostsWithAuthors();

    expect(posts).toHaveLength(0);
    expect(queryCount).toBe(1);
  });
});
