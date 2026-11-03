import { emailQueue } from "./queues/email.queue.js";
import { redisConnection } from "./config/redis.js";

async function testQueue() {
  try {
    const job = await emailQueue.add(
      "send-email",
      {
        emailId: "test-email-001",
      }
    );

    console.log("Test job added successfully:", job.id);
  } catch (error) {
    console.error("Queue test failed:", error);
  } finally {
    await emailQueue.close();
    await redisConnection.quit();
  }
}

void testQueue();