
import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const searchIndexQueue = new Queue("email-search-index", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export async function enqueueEmailIndex(emailId: string) {
  return searchIndexQueue.add(
    "index-email",
    { emailId },
    {
      jobId: `email-index-${emailId}-${Date.now()}`,
    }
  );
}
