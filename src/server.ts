import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./prisma/client.js";

const server = app.listen(env.PORT, () => {
  logger.info("PantryFrugalAI backend listening", { port: env.PORT });
});

const shutdown = async (signal: string) => {
  logger.info("Shutting down", { signal });
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
