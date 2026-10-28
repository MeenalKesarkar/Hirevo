import { Router } from "express";
import type { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashToken, issueTokenPair, REFRESH_COOKIE, REFRESH_MAX_AGE_MS } from "../utils/tokens.js";

export const authRouter = Router();
const googleOAuthClient = new OAuth2Client();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
});
const credentialsSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72),
});
const googleCredentialSchema = z.object({ credential: z.string().min(1).max(20_000) });
const profileSchema = z.object({
  headline: z.string().trim().max(140).optional(),
  location: z.string().trim().max(120).optional(),
  about: z.string().trim().max(2_000).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  education: z.array(z.object({
    institution: z.string().trim().min(1).max(140),
    degree: z.string().trim().min(1).max(120),
    fieldOfStudy: z.string().trim().max(120).optional(),
    startYear: z.string().trim().max(20).optional(),
    endYear: z.string().trim().max(20).optional(),
  }).strict()).max(10).optional(),
  experience: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    company: z.string().trim().min(1).max(140),
    location: z.string().trim().max(120).optional(),
    startYear: z.string().trim().max(20).optional(),
    endYear: z.string().trim().max(20).optional(),
    description: z.string().trim().max(1_000).optional(),
  }).strict()).max(10).optional(),
  profileImageData: z.string().max(1_100_000).refine((value) => value === "" || /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value), "Profile photo must be a JPG, PNG, or WebP image.").optional(),
  coverImageData: z.string().max(1_100_000).refine((value) => value === "" || /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value), "Cover image must be a JPG, PNG, or WebP image.").optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Add at least one profile field to update.");

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
  response.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}));

authRouter.post("/login", asyncHandler(async (request, response) => {
  const input = credentialsSchema.parse(request.body);
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
    response.status(401).json({ error: "Email or password is incorrect." });
    return;
  }
  const tokens = await issueTokenPair(user);
  setRefreshCookie(response, tokens.refreshToken);
  response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
  });
}));

authRouter.post("/google", asyncHandler(async (request, response) => {
  if (!env.GOOGLE_CLIENT_ID) {
    response.status(503).json({ error: "Google sign-in is not configured on the server." });
    return;
  }

  const { credential } = googleCredentialSchema.parse(request.body);
  let payload;
  try {
    const ticket = await googleOAuthClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    response.status(401).json({ error: "Google could not verify this sign-in. Please try again." });
    return;
  }

  const googleId = payload?.sub;
  const email = payload?.email?.trim().toLowerCase();
  if (!googleId || !email || payload?.email_verified !== true) {
    response.status(401).json({ error: "A verified Google email is required to sign in." });
    return;
  }

  let user = await User.findOne({ googleId }).select("+googleId");
  if (!user) {
    user = await User.findOne({ email }).select("+googleId");
    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        response.status(409).json({ error: "This email is already connected to a different Google account." });
        return;
      }
      const googleIsAuthoritativeForEmail = email.endsWith("@gmail.com") || Boolean(payload.hd);
      if (!googleIsAuthoritativeForEmail) {
        response.status(409).json({ error: "Sign in with your password first to connect this Google account." });
        return;
      }
      user.googleId = googleId;
      await user.save();
    } else {
      const suggestedName = payload.name?.trim().slice(0, 100) || email.split("@")[0];
      const name = suggestedName.length >= 2 ? suggestedName : "Google member";
      user = await User.create({ name, email, googleId, role: "candidate" });
    }
  }

  const tokens = await issueTokenPair(user);
  setRefreshCookie(response, tokens.refreshToken);
  response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
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
  const user = await User.findById(request.auth?.userId).select("name email role createdAt headline location about skills education experience profileImageData coverImageData");
  if (!user) {
    response.status(404).json({ error: "Account not found." });
    return;
  }
  response.json({ user });
}));

authRouter.patch("/me", requireAuth, asyncHandler(async (request, response) => {
  const input = profileSchema.parse(request.body);
  const user = await User.findByIdAndUpdate(request.auth?.userId, { $set: input }, {
    new: true,
    runValidators: true,
  }).select("name email role createdAt headline location about skills education experience profileImageData coverImageData");
  if (!user) {
    response.status(404).json({ error: "Account not found." });
    return;
  }
  response.json({ user });
}));

authRouter.get("/people", requireAuth, asyncHandler(async (request, response) => {
  const query = z.object({
    q: z.string().trim().max(100).optional(),
    role: z.enum(["candidate", "recruiter"]).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(6),
  }).parse(request.query);
  const filter: Record<string, unknown> = {
    _id: { $ne: request.auth?.userId },
    role: query.role ? query.role : { $in: ["candidate", "recruiter"] },
  };
  if (query.q) {
    const safeSearch = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = { $regex: safeSearch, $options: "i" };
    filter.$or = [{ name: pattern }, { headline: pattern }, { location: pattern }, { skills: pattern }];
  }
  const people = await User.find(filter)
    .select("name role headline location skills createdAt")
    .sort({ createdAt: -1 })
    .limit(query.limit)
    .lean();
  response.json({ people });
}));

