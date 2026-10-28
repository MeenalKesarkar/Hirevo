import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/User.js";

async function removeUsernames(): Promise<void> {
  await connectDatabase();

  const indexes = await User.collection.indexes();
  for (const index of indexes) {
    if (index.name && index.key && "username" in index.key) {
      await User.collection.dropIndex(index.name);
    }
  }

  const result = await User.collection.updateMany(
    { username: { $exists: true } },
    { $unset: { username: "" } },
  );
  console.info(`Removed username from ${result.modifiedCount} user records.`);
  await mongoose.disconnect();
}

removeUsernames().catch(async (error: unknown) => {
  console.error("Failed to remove usernames from Hirevo users:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
