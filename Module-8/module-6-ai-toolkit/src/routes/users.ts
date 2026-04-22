import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../types";
import { generateId, isValidEmail } from "../utils/helpers";

const router = Router();

type SafeUser = Omit<User, "password">;

function stripPassword(user: User): SafeUser {
  const { password: _, ...safe } = user;
  return safe;
}

// Seed hash computed once at module load so resetUsers() is synchronous
const SEED_HASH = bcrypt.hashSync("seed-password", 10);

const SEED_USERS: User[] = [
  {
    id: "user-001",
    name: "Alice Chen",
    email: "alice@example.com",
    password: SEED_HASH,
    role: "admin",
    createdAt: "2026-02-15T08:00:00Z",
  },
  {
    id: "user-002",
    name: "Bob Martinez",
    email: "bob@example.com",
    password: SEED_HASH,
    role: "member",
    createdAt: "2026-02-20T10:00:00Z",
  },
];

// In-memory user storage
let users: User[] = [...SEED_USERS];

// GET /api/users - List all users
router.get("/", (_req: Request, res: Response) => {
  res.json({ users: users.map(stripPassword), total: users.length });
});

// GET /api/users/:id - Get a single user
router.get("/:id", (req: Request, res: Response) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user: stripPassword(user) });
});

// POST /api/users - Create a new user
router.post("/", async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const newUser: User = {
    id: generateId(),
    name: name || "",
    email,
    password: await bcrypt.hash(password, 12),
    role: "member", // role is never accepted from the caller
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  res.status(201).json({ user: stripPassword(newUser) });
});

// Export for use by tasks route (N+1 simulation)
export function getUsers(): User[] {
  return users;
}

export function resetUsers(): void {
  users = [...SEED_USERS];
}

export default router;
