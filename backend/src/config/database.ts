import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  const dnsServers = env.MONGODB_DNS_SERVERS?.split(",").map((server) => server.trim()).filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.info(`MongoDB connected to database: ${mongoose.connection.name}`);
}
