import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "tasks.db");

export interface Task {
  id: number;
  title: string;
  status: "todo" | "done";
  createdAt: string;
  dueDate: string | null;
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      db.exec("ALTER TABLE tasks ADD COLUMN due_date TEXT");
    } catch {
      // column already exists, ignore
    }
  }
  return db;
}

export function validateDueDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `Invalid date format "${date}". Use YYYY-MM-DD (e.g., 2026-12-31).`;
  }
  const parsed = new Date(date + "T00:00:00");
  if (isNaN(parsed.getTime())) {
    return `Invalid date "${date}". Use YYYY-MM-DD (e.g., 2026-12-31).`;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) {
    return `Due date "${date}" is in the past. Please provide a present or future date.`;
  }
  return null;
}

export function getAllTasks(): Task[] {
  const rows = getDb()
    .prepare("SELECT id, title, status, created_at as createdAt, due_date as dueDate FROM tasks ORDER BY id")
    .all();
  return rows as Task[];
}

export function addTask(title: string, dueDate?: string | null): Task {
  const stmt = getDb().prepare(
    "INSERT INTO tasks (title, due_date) VALUES (?, ?)"
  );
  const result = stmt.run(title, dueDate ?? null);
  return {
    id: result.lastInsertRowid as number,
    title,
    status: "todo",
    createdAt: new Date().toISOString(),
    dueDate: dueDate ?? null,
  };
}

export function updateDueDate(id: number, dueDate: string | null): boolean {
  const result = getDb()
    .prepare("UPDATE tasks SET due_date = ? WHERE id = ?")
    .run(dueDate, id);
  return result.changes > 0;
}

export function markDone(id: number): boolean {
  const result = getDb()
    .prepare("UPDATE tasks SET status = 'done' WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

export function deleteTask(id: number): boolean {
  const result = getDb()
    .prepare("DELETE FROM tasks WHERE id = ?")
    .run(id);
  return result.changes > 0;
}
