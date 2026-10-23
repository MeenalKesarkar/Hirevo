import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { HydratedDocument } from "mongoose";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";
import type { UserRecord } from "../models/User.js";

export const REFRESH_COOKIE = "hirevo_refresh";
export const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueTokenPair(user: HydratedDocument<UserRecord>) {
  const userId = user._id.toString();
  const accessToken = jwt.sign({ role: user.role }, env.ACCESS_TOKEN_SECRET, {
    subject: userId,
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ type: "refresh", nonce: randomUUID() }, env.REFRESH_TOKEN_SECRET, {
    subject: userId,
    expiresIn: "7d",
  });

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_MS),
  });

  return { accessToken, refreshToken };
}
