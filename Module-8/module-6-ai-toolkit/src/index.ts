import express from "express";
import taskRoutes from "./routes/tasks";
import userRoutes from "./routes/users";
import { authMiddleware } from "./middleware/auth";
import {
  requestIdMiddleware,
  requestLogger,
  logger,
} from "./middleware/logger";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 3458;

// Middleware
app.use(express.json());
app.use(requestIdMiddleware);
app.use(requestLogger);

// Routes — all /api routes require a valid Bearer token
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/users", authMiddleware, userRoutes);

// Health check (unauthenticated)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 and global error handlers — must be last
app.use(notFoundHandler);
app.use(errorHandler);

// Start server (only when run directly, not during tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info("server started", { port: PORT, env: process.env.NODE_ENV });
  });

  function shutdown(signal: string): void {
    logger.info("shutdown initiated", { signal });

    server.close(() => {
      logger.info("http server closed");

      // Close DB connections or other resources here when added
      // e.g. await db.end()

      logger.info("shutdown complete");
      process.exit(0);
    });

    // Force exit if in-flight requests don't drain in time
    setTimeout(() => {
      logger.error("forced shutdown after timeout", { timeoutMs: 10_000 });
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;
