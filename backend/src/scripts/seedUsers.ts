import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

const demoUsers = [
  { name: "Meenal", username: "meenal", email: "meenal.example@gmail.com", role: "candidate" as const, password: env.DEMO_PASSWORD_MEENAL },
  { name: "Hemanth", username: "hemanth", email: "hemanth.example@gmail.com", role: "candidate" as const, password: env.DEMO_PASSWORD_HEMANTH },
  { name: "Aisha", username: "aisha", email: "aisha.example@gmail.com", role: "candidate" as const, password: env.DEMO_PASSWORD_AISHA },
  { name: "Arjun", username: "arjun", email: "arjun.example@gmail.com", role: "candidate" as const, password: env.DEMO_PASSWORD_ARJUN },
  { name: "Priya", username: "priya", email: "priya.example@gmail.com", role: "candidate" as const, password: env.DEMO_PASSWORD_PRIYA },
  { name: "Rohan", username: "rohan", email: "rohan.example@gmail.com", role: "candidate" as const, password: env.DEMO_PASSWORD_ROHAN },
  { name: "Recruiter", username: "recruiter", email: "recruiter.example@gmail.com", role: "recruiter" as const, password: env.DEMO_PASSWORD_RECRUITER },
];

async function seedUsers(): Promise<void> {
  if (!demoUsers.every((user) => user.password)) {
    throw new Error("Set all seven DEMO_PASSWORD_* values in backend/.env before seeding demo accounts.");
  }
  await connectDatabase();

  for (const demoUser of demoUsers) {
    const { password, ...userDetails } = demoUser;
    const passwordHash = await bcrypt.hash(password!, 12);
    await User.findOneAndUpdate(
      { $or: [{ email: userDetails.email }, { username: userDetails.username }] },
      { $set: { ...userDetails, passwordHash } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.info(`Seeded demo ${userDetails.role} account: @${userDetails.username}`);
  }

  await mongoose.disconnect();
}

seedUsers().catch(async (error: unknown) => {
  console.error("Failed to seed Hirevo demo users:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
