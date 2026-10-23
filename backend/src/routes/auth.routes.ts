import { Router } from "express";
import type { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashToken, issueTokenPair, REFRESH_COOKIE, REFRESH_MAX_AGE_MS } from "../utils/tokens.js";

export const authRouter = Router();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9._-]+$/),
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
});
const credentialsSchema = z.object({
  identifier: z.string().trim().min(1).max(320).optional(),
  email: z.email().transform((email) => email.toLowerCase()).optional(),
  password: z.string().min(1).max(72),
}).refine((input) => Boolean(input.identifier || input.email), { message: "Username or email is required." });

function setRefreshCookie(response: Response, token: string): void {
  response.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

authRouter.post("/register", asyncHandler(async (request, response) => {
  const input = registerSchema.parse(request.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ ...input, passwordHash });
  const tokens = await issueTokenPair(user);
  setRefreshCookie(response, tokens.refreshToken);
  response.status(201).json({
    user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
  });
}));

authRouter.post("/login", asyncHandler(async (request, response) => {
  const input = credentialsSchema.parse(request.body);
  const identifier = (input.identifier ?? input.email ?? "").trim().toLowerCase();
  const user = await User.findOne(identifier.includes("@") ? { email: identifier } : { username: identifier }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    response.status(401).json({ error: "Username, email, or password is incorrect." });
    return;
  }
  const tokens = await issueTokenPair(user);
  setRefreshCookie(response, tokens.refreshToken);
  response.json({
    user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
  });
}));

authRouter.post("/refresh", asyncHandler(async (request, response) => {
  const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!refreshToken) {
    response.status(401).json({ error: "Refresh token is missing." });
    return;
  }

  let userId: string;
  try {
    const payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
    if (typeof payload === "string" || !payload.sub || payload.type !== "refresh") throw new Error("Invalid refresh token");
    userId = payload.sub;
  } catch {
    response.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    response.status(401).json({ error: "Refresh token is invalid or expired." });
    return;
  }

  const storedToken = await RefreshToken.findOneAndDelete({
    userId: new mongoose.Types.ObjectId(userId),
    tokenHash: hashToken(refreshToken),
    expiresAt: { $gt: new Date() },
  });
  if (!storedToken) {
    response.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    response.status(401).json({ error: "Refresh token has already been used or revoked." });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    response.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    response.status(401).json({ error: "Account no longer exists." });
    return;
  }

  const tokens = await issueTokenPair(user);
  setRefreshCookie(response, tokens.refreshToken);
  response.json({ accessToken: tokens.accessToken });
}));

authRouter.post("/logout", asyncHandler(async (request, response) => {
  const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (refreshToken) await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
  response.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  response.status(204).end();
}));

authRouter.get("/me", requireAuth, asyncHandler(async (request, response) => {
  const user = await User.findById(request.auth?.userId).select("name username email role createdAt");
  if (!user) {
    response.status(404).json({ error: "Account not found." });
    return;
  }
  response.json({ user });
}));

