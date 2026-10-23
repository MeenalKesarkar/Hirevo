import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function startServer(): Promise<void> {
  await connectDatabase();
  const server = app.listen(env.PORT, () => {
    console.info(`Hirevo API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      void import("mongoose").then(({ default: mongoose }) => mongoose.disconnect()).finally(() => process.exit(0));
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error: unknown) => {
  console.error("Failed to start Hirevo API:", error);
  process.exitCode = 1;
});
