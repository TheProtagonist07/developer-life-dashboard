import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { queryOne } from "../db";
import type { DBUser } from "../types";

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token =
    req.cookies?.[config.cookieName] ??
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
    (req as Request & { userId: string }).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
  }
}

export function requireHaAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers.authorization?.replace("Bearer ", "");
  if (!config.haApiKey || key !== config.haApiKey) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED" } });
  }
  return next();
}

export function issueToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  const userId = (req as Request & { userId: string }).userId;
  const user = await queryOne<DBUser>("SELECT * FROM users WHERE id = $1", [userId]);
  if (!user) return _res.status(401).json({ success: false, error: { code: "USER_NOT_FOUND" } });
  req.user = user;
  return next();
}
