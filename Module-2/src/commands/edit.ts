import { updateDueDate, validateDueDate } from "../db";

export function handleEdit(id: string, options: { dueDate?: string }): void {
  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    console.error("Error: ID must be a number");
    process.exit(1);
  }

  if (options.dueDate) {
    const error = validateDueDate(options.dueDate);
    if (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  }

  if (!updateDueDate(taskId, options.dueDate ?? null)) {
    console.error(`Error: Task #${taskId} not found`);
    process.exit(1);
  }

  const dueDateInfo = options.dueDate ? `set to ${options.dueDate}` : "cleared";
  console.log(`✓ Task #${taskId} due date ${dueDateInfo}`);
}
