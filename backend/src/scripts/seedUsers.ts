import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/User.js";

const demoUsers = [
  { name: "Hirevo Demo Candidate", email: "candidate.demo@example.com", role: "candidate" as const },
  { name: "Hirevo Demo Recruiter", email: "recruiter.demo@example.com", role: "recruiter" as const },
];

async function seedUsers(): Promise<void> {
  await connectDatabase();

  for (const demoUser of demoUsers) {
    const existingUser = await User.findOne({ email: demoUser.email });
    if (existingUser) {
      console.info(`Skipped existing demo ${demoUser.role} account: ${demoUser.email}`);
      continue;
    }

    const password = randomBytes(18).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ ...demoUser, passwordHash });
    console.info(`Created demo ${demoUser.role}: ${demoUser.email} | temporary password: ${password}`);
  }

  await mongoose.disconnect();
}

seedUsers().catch(async (error: unknown) => {
  console.error("Failed to seed Hirevo demo users:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
