
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { prisma } from "../lib/prisma.js";
import { indexEmail } from "../services/email-search.service.js";

export const searchIndexWorker = new Worker(
  "email-search-index",
  async (job) => {
    const { emailId } = job.data as { emailId: string };

    // Always fetch the latest PostgreSQL state.
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      return;
    }

    await indexEmail(email);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

searchIndexWorker.on("completed", (job) => {
  console.log(`Email indexed: ${job.data.emailId}`);
});

searchIndexWorker.on("failed", (job, error) => {
  console.error("Email indexing failed:", job?.data?.emailId, error);
});
