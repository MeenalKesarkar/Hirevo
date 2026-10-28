import { Schema, model } from "mongoose";

export type UserRole = "candidate" | "recruiter" | "admin";

export interface EducationRecord {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: string;
  endYear?: string;
}

export interface ExperienceRecord {
  title: string;
  company: string;
  location?: string;
  startYear?: string;
  endYear?: string;
  description?: string;
}

export interface UserRecord {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  headline?: string;
  location?: string;
  about?: string;
  skills?: string[];
  education?: EducationRecord[];
  experience?: ExperienceRecord[];
  profileImageData?: string;
  coverImageData?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },
    role: { type: String, enum: ["candidate", "recruiter", "admin"], default: "candidate" },
    headline: { type: String, trim: true, maxlength: 140, default: "" },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    about: { type: String, trim: true, maxlength: 2_000, default: "" },
    skills: { type: [String], default: [], validate: (values: string[]) => values.length <= 20 },
    education: {
      type: [{
        institution: { type: String, required: true, trim: true, maxlength: 140 },
        degree: { type: String, required: true, trim: true, maxlength: 120 },
        fieldOfStudy: { type: String, trim: true, maxlength: 120 },
        startYear: { type: String, trim: true, maxlength: 20 },
        endYear: { type: String, trim: true, maxlength: 20 },
      }],
      default: [],
      validate: (values: EducationRecord[]) => values.length <= 10,
    },
    experience: {
      type: [{
        title: { type: String, required: true, trim: true, maxlength: 120 },
        company: { type: String, required: true, trim: true, maxlength: 140 },
        location: { type: String, trim: true, maxlength: 120 },
        startYear: { type: String, trim: true, maxlength: 20 },
        endYear: { type: String, trim: true, maxlength: 20 },
        description: { type: String, trim: true, maxlength: 1000 },
      }],
      default: [],
      validate: (values: ExperienceRecord[]) => values.length <= 10,
    },
    profileImageData: { type: String, default: "", maxlength: 1_100_000 },
    coverImageData: { type: String, default: "", maxlength: 1_100_000 },
  },
  { timestamps: true },
);

export const User = model<UserRecord>("User", userSchema);
