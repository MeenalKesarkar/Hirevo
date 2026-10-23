import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  ACCESS_TOKEN_SECRET: z.string().min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),
  REFRESH_TOKEN_SECRET: z.string().min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),
  DEMO_PASSWORD_MEENAL: z.string().min(8).max(72).optional(),
  DEMO_PASSWORD_HEMANTH: z.string().min(8).max(72).optional(),
  DEMO_PASSWORD_AISHA: z.string().min(8).max(72).optional(),
  DEMO_PASSWORD_ARJUN: z.string().min(8).max(72).optional(),
  DEMO_PASSWORD_PRIYA: z.string().min(8).max(72).optional(),
  DEMO_PASSWORD_ROHAN: z.string().min(8).max(72).optional(),
  DEMO_PASSWORD_RECRUITER: z.string().min(8).max(72).optional(),
});

export const env = environmentSchema.parse(process.env);
