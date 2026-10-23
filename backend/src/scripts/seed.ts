import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { Job } from "../models/Job.js";

const demoJobs = [
  {
    title: "Frontend Engineer",
    company: "Northstar Studio",
    location: "Bengaluru, India",
    workplaceType: "hybrid" as const,
    employmentType: "full-time" as const,
    description: "Build accessible product experiences with a collaborative design and engineering team.",
    skills: ["React", "TypeScript", "Accessibility"],
  },
  {
    title: "Product Designer",
    company: "Juniper Labs",
    location: "Remote - India",
    workplaceType: "remote" as const,
    employmentType: "full-time" as const,
    description: "Shape clear, useful product flows and partner closely with research and engineering.",
    skills: ["Product design", "Figma", "Prototyping"],
  },
  {
    title: "Data Analyst Intern",
    company: "Brightpath Analytics",
    location: "Pune, India",
    workplaceType: "onsite" as const,
    employmentType: "internship" as const,
    description: "Help teams answer business questions with well-documented analysis and dashboards.",
    skills: ["SQL", "Python", "Data visualization"],
  },
];

async function seed(): Promise<void> {
  await connectDatabase();
  for (const job of demoJobs) {
    await Job.updateOne({ title: job.title, company: job.company }, { $setOnInsert: job }, { upsert: true });
  }
  console.info(`Demo job data is ready (${demoJobs.length} records).`);
  await mongoose.disconnect();
}

seed().catch(async (error: unknown) => {
  console.error("Failed to seed Hirevo demo data:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
