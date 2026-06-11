import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.flatten().fieldErrors,
      },
    });
  }

  console.error(`[${req.method} ${req.path}]`, err);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
  });
}
