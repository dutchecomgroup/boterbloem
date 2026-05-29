import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userEmail?: string;
  }
}

export interface AuthedRequest extends Request {
  user?: Pick<User, "id" | "email" | "name" | "role">;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Niet ingelogd" });
  }
  next();
}
