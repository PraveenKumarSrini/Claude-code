import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const isProd = () => process.env.NODE_ENV === "production";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "Not found",
    requestId: req.requestId,
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    logger.warn("operational error", {
      requestId,
      statusCode: err.statusCode,
      message: err.message,
    });
    res.status(err.statusCode).json({ error: err.message, requestId });
    return;
  }

  logger.error("unhandled error", {
    requestId,
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: isProd() ? "Internal server error" : err.message,
    requestId,
    ...(isProd() ? {} : { stack: err.stack }),
  });
}
