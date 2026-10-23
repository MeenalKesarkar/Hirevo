import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth: RequestHandler = asyncHandler((request, response, next) => {
  const authorization = request.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  if (!token) {
    response.status(401).json({ error: "Authentication is required." });
    return;
  }

  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    if (typeof payload === "string" || !payload.sub || typeof payload.role !== "string") {
      response.status(401).json({ error: "Invalid access token." });
      return;
    }
    request.auth = { userId: payload.sub, role: payload.role as UserRole };
    next();
  } catch {
    response.status(401).json({ error: "Access token is invalid or expired." });
  }
});

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (request, response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      response.status(403).json({ error: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
}
