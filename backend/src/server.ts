import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { redisConnection } from "./config/redis.js";

import { emailQueue } from "./queues/email.queue.js";
import { searchIndexQueue } from "./queues/search-index.queue.js";

import { emailWorker } from "./workers/email.worker.js";
import { searchIndexWorker } from "./workers/search-index.worker.js";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { ensureEmailIndex } from "./config/elasticsearch.js";
import { checkElasticsearchConnection } from "./config/elasticsearch.js";

async function startServer(): Promise<void> {
  try {
    // 1. Connect PostgreSQL
    await prisma.$connect();
    console.log("PostgreSQL connected successfully");

    // 2. Connect Redis
    await redisConnection.ping();
    console.log("Redis connected successfully");

    // 3. Initialize Elasticsearch
    try {
      const info = await checkElasticsearchConnection();
      await ensureEmailIndex();

      console.log(
        `Elasticsearch connected successfully: ${info.version.number}`
      );
    } catch (error) {
      console.error(
        "Elasticsearch connection failed. Search indexing may be unavailable:",
        error
      );
    }

    // 4. Initialize Bull Board
    const serverAdapter = new ExpressAdapter();

    serverAdapter.setBasePath("/admin/queues");

    createBullBoard({
      queues: [
        new BullMQAdapter(emailQueue),
        new BullMQAdapter(searchIndexQueue),
      ],
      serverAdapter,
    });

    app.use("/admin/queues", serverAdapter.getRouter());

    // 5. Start HTTP server
    const server = app.listen(env.PORT, () => {
      console.log(`
========================================
       REACHINBOX BACKEND STARTED
========================================

Environment: ${env.NODE_ENV}
Port: ${env.PORT}

Health:
http://localhost:${env.PORT}/health

Bull Board:
http://localhost:${env.PORT}/admin/queues

Email Worker:
Concurrency: ${env.EMAIL_CONCURRENCY}

Search Index Worker:
Concurrency: 5

========================================
      `);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
      process.exitCode = 1;
    });

    // 6. Graceful shutdown
    let shuttingDown = false;

    const shutdown = async (signal: string) => {
      if (shuttingDown) return;

      shuttingDown = true;

      console.log(`\n${signal} received. Shutting down...`);

      server.close(async (error) => {
        try {
          if (error) {
            console.error("HTTP shutdown error:", error);
          }

          await Promise.all([
            emailWorker.close(),
            searchIndexWorker.close(),
          ]);

          console.log("Workers closed");

          await Promise.all([
            emailQueue.close(),
            searchIndexQueue.close(),
          ]);

          console.log("Queues closed");

          await redisConnection.quit();
          console.log("Redis disconnected");

          await prisma.$disconnect();
          console.log("PostgreSQL disconnected");

          console.log("Graceful shutdown completed");

          process.exitCode = error ? 1 : 0;
        } catch (shutdownError) {
          console.error("Shutdown error:", shutdownError);
          process.exitCode = 1;
        }
      });
    };

    process.once("SIGTERM", () => void shutdown("SIGTERM"));
    process.once("SIGINT", () => void shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start backend:", error);

    await Promise.allSettled([
      emailWorker.close(),
      searchIndexWorker.close(),
      emailQueue.close(),
      searchIndexQueue.close(),
      redisConnection.quit(),
      prisma.$disconnect(),
    ]);

    process.exitCode = 1;
  }
}

void startServer();