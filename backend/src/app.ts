import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { jobsRouter } from "./routes/jobs.routes.js";
import { postsRouter } from "./routes/posts.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL.split(",").map((origin) => origin.trim()), credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/api/health", healthRouter);
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/posts", postsRouter);
app.use((_request, response) => response.status(404).json({ error: "API route not found." }));
app.use(errorHandler);
