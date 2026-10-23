import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Job } from "../models/Job.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const jobsRouter = Router();
const jobFieldsSchema = z.object({
  title: z.string().trim().min(2).max(150),
  company: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  workplaceType: z.enum(["remote", "hybrid", "onsite"]),
  employmentType: z.enum(["full-time", "part-time", "contract", "internship"]),
  description: z.string().trim().min(20).max(12_000),
  skills: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
});
const createJobSchema = jobFieldsSchema.refine((job) => job.salaryMin === undefined || job.salaryMax === undefined || job.salaryMin <= job.salaryMax, {
  message: "salaryMin must not exceed salaryMax.",
});
const updateJobSchema = jobFieldsSchema.partial().refine((job) => job.salaryMin === undefined || job.salaryMax === undefined || job.salaryMin <= job.salaryMax, {
  message: "salaryMin must not exceed salaryMax.",
});

jobsRouter.get("/", asyncHandler(async (request, response) => {
  const querySchema = z.object({
    q: z.string().trim().max(100).optional(),
    location: z.string().trim().max(120).optional(),
    workplaceType: z.enum(["remote", "hybrid", "onsite"]).optional(),
    employmentType: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  });
  const query = querySchema.parse(request.query);
  const filter: Record<string, unknown> = {};
  if (query.q) filter.$text = { $search: query.q };
  if (query.location) filter.location = { $regex: query.location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (query.workplaceType) filter.workplaceType = query.workplaceType;
  if (query.employmentType) filter.employmentType = query.employmentType;

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    Job.countDocuments(filter),
  ]);
  response.json({ jobs, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
}));

jobsRouter.get("/:jobId", asyncHandler(async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.jobId)) {
    response.status(400).json({ error: "Job identifier is invalid." });
    return;
  }
  const job = await Job.findById(request.params.jobId).lean();
  if (!job) {
    response.status(404).json({ error: "Job not found." });
    return;
  }
  response.json({ job });
}));

jobsRouter.post("/", requireAuth, requireRole("recruiter", "admin"), asyncHandler(async (request, response) => {
  const input = createJobSchema.parse(request.body);
  const job = await Job.create({ ...input, postedBy: request.auth!.userId });
  response.status(201).json({ job });
}));

jobsRouter.patch("/:jobId", requireAuth, requireRole("recruiter", "admin"), asyncHandler(async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.jobId)) {
    response.status(400).json({ error: "Job identifier is invalid." });
    return;
  }
  const input = updateJobSchema.parse(request.body);
  const job = await Job.findById(request.params.jobId);
  if (!job) {
    response.status(404).json({ error: "Job not found." });
    return;
  }
  if (request.auth!.role !== "admin" && job.postedBy?.toString() !== request.auth!.userId) {
    response.status(403).json({ error: "You can only update your own job listings." });
    return;
  }
  Object.assign(job, input);
  await job.save();
  response.json({ job });
}));

jobsRouter.delete("/:jobId", requireAuth, requireRole("recruiter", "admin"), asyncHandler(async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.jobId)) {
    response.status(400).json({ error: "Job identifier is invalid." });
    return;
  }
  const job = await Job.findById(request.params.jobId);
  if (!job) {
    response.status(404).json({ error: "Job not found." });
    return;
  }
  if (request.auth!.role !== "admin" && job.postedBy?.toString() !== request.auth!.userId) {
    response.status(403).json({ error: "You can only remove your own job listings." });
    return;
  }
  await job.deleteOne();
  response.status(204).end();
}));
