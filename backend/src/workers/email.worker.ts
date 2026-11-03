
import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../services/email.service.js";
import { enqueueEmailIndex } from "../queues/search-index.queue.js";

interface EmailJobData {
  emailId: string;
}

async function refreshEmailSearchIndex(emailId: string) {
  try {
    await enqueueEmailIndex(emailId);
  } catch (error) {
    console.error(
      `Failed to queue Elasticsearch update for ${emailId}:`,
      error
    );
  }
}

export const emailWorker = new Worker<EmailJobData>(
  "email-queue",
  async (job: Job<EmailJobData>) => {
    const { emailId } = job.data;

    console.log(`Processing email: ${emailId}`);

    // 1. Fetch email
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      throw new Error(`Email not found: ${emailId}`);
    }

    // 2. Prevent duplicate sending
    if (email.status === "SENT") {
      console.log(`Email already sent: ${emailId}`);

      return {
        success: true,
        alreadySent: true,
      };
    }

    // 3. Mark as PROCESSING
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        errorMessage: null,
      },
    });

    await refreshEmailSearchIndex(emailId);

    try {
      // 4. Send email through Ethereal SMTP
      const result = await sendEmail({
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      });

      // 5. Update PostgreSQL
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      // 6. Update Elasticsearch asynchronously
      await refreshEmailSearchIndex(emailId);

      console.log(`Email sent successfully: ${emailId}`);
      console.log("Message ID:", result.messageId);
      console.log("Preview URL:", result.previewUrl);

      return {
        success: true,
        emailId,
        messageId: result.messageId,
        previewUrl: result.previewUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown email error";

      const attemptsMade = job.attemptsMade + 1;
      const maxAttempts = job.opts.attempts ?? 1;

      // 7. Only mark FAILED after final retry
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status:
            attemptsMade >= maxAttempts
              ? "FAILED"
              : "SCHEDULED",
          errorMessage,
        },
      });

      await refreshEmailSearchIndex(emailId);

      console.error(
        `Email attempt ${attemptsMade}/${maxAttempts} failed:`,
        errorMessage
      );

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: env.EMAIL_CONCURRENCY,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
  console.error(
    `Email job ${job?.id} failed:`,
    error.message
  );
});

emailWorker.on("error", (error) => {
  console.error("Worker error:", error);
});
