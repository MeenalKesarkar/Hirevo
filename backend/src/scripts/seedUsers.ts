import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/User.js";

const demoUsers = [
  { name: "Meenal", email: "meenal.example@gmail.com", role: "candidate" as const },
  { name: "Hemanth", email: "hemanth.example@gmail.com", role: "candidate" as const },
  { name: "Aisha", email: "aisha.example@gmail.com", role: "candidate" as const },
  { name: "Arjun", email: "arjun.example@gmail.com", role: "candidate" as const },
  { name: "Priya", email: "priya.example@gmail.com", role: "candidate" as const },
  { name: "Rohan", email: "rohan.example@gmail.com", role: "candidate" as const },
  { name: "Recruiter", email: "recruiter.example@gmail.com", role: "recruiter" as const },
];

async function seedUsers(): Promise<void> {
  await connectDatabase();

  for (const demoUser of demoUsers) {
    const userDetails = demoUser;
    const password = `${userDetails.name}123`;
    const passwordHash = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate(
      { email: userDetails.email },
      { $set: { ...userDetails, passwordHash } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.info(`Seeded demo ${userDetails.role} account: ${userDetails.email}`);
  }

  await mongoose.disconnect();
}

seedUsers().catch(async (error: unknown) => {
  console.error("Failed to seed Hirevo demo users:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
