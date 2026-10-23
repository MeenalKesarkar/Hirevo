import { Schema, model } from "mongoose";

export type UserRole = "candidate" | "recruiter" | "admin";

export interface UserRecord {
  name: string;
  username?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    username: { type: String, trim: true, lowercase: true, minlength: 3, maxlength: 30, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["candidate", "recruiter", "admin"], default: "candidate" },
  },
  { timestamps: true },
);

export const User = model<UserRecord>("User", userSchema);
