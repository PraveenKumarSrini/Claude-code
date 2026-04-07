import { getAllTasks } from "../db";
import { formatDueDate } from "../utils";

export function handleList(): void {
  const tasks = getAllTasks();

  if (tasks.length === 0) {
    console.log("No tasks yet. Add one with: taskmaster add \"Your task\"");
    return;
  }

  console.log("\n  ID  Status  Due Date              Title");
  console.log("  " + "─".repeat(55));

  for (const task of tasks) {
    const status = task.status === "done" ? "✓ done" : "○ todo";
    const dueDate = task.dueDate ? formatDueDate(task.dueDate) : "—";
    console.log(`  ${String(task.id).padStart(2)}  ${status.padEnd(6)}  ${dueDate.padEnd(20)}  ${task.title}`);
  }

  console.log();
}
