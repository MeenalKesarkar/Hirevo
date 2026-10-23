import { Schema, model, Types } from "mongoose";

export type WorkplaceType = "remote" | "hybrid" | "onsite";
export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";

export interface JobRecord {
  title: string;
  company: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  description: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  postedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<JobRecord>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150, index: true },
    company: { type: String, required: true, trim: true, maxlength: 120, index: true },
    location: { type: String, required: true, trim: true, maxlength: 120, index: true },
    workplaceType: { type: String, enum: ["remote", "hybrid", "onsite"], required: true },
    employmentType: { type: String, enum: ["full-time", "part-time", "contract", "internship"], required: true },
    description: { type: String, required: true, maxlength: 12_000 },
    skills: { type: [String], default: [] },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    postedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

jobSchema.index({ title: "text", company: "text", description: "text", skills: "text" });

export const Job = model<JobRecord>("Job", jobSchema);
