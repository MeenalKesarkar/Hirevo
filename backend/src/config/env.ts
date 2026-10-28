import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Load the backend's own .env file regardless of whether npm was started from
// the repository root or from the backend directory.
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DNS_SERVERS: z.string().optional(),
  ACCESS_TOKEN_SECRET: z.string().min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),
  REFRESH_TOKEN_SECRET: z.string().min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),
  GOOGLE_CLIENT_ID: z.string().trim().optional(),
});

export const env = environmentSchema.parse(process.env);
