import "dotenv/config";
import app from "./app.js";
import { config } from "./config/env.js";
import { prisma } from "./config/database.js";

const server = app.listen(config.port, () => {
  console.log(`VeriNest API listening on port ${config.port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);