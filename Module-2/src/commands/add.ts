import { addTask, validateDueDate } from "../db";

export function handleAdd(title: string, options: { dueDate?: string }): void {
  if (options.dueDate) {
    const error = validateDueDate(options.dueDate);
    if (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  }

  const task = addTask(title, options.dueDate);
  const dueDateInfo = task.dueDate ? ` (due: ${task.dueDate})` : "";
  console.log(`✓ Added task #${task.id}: "${task.title}"${dueDateInfo}`);
}
