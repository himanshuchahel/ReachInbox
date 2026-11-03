
import { prisma } from "./lib/prisma.js";
import { emailQueue } from "./queues/email.queue.js";
import { redisConnection } from "./config/redis.js";

async function testFullEmailFlow() {
  const uniqueId = Date.now().toString();

  try {
    // 1. Create a test user
    const user = await prisma.user.create({
      data: {
        googleId: `test-google-${uniqueId}`,
        email: `test-${uniqueId}@example.com`,
        name: "ReachInbox Test User",
      },
    });

    // 2. Create a sender
    const sender = await prisma.sender.create({
      data: {
        userId: user.id,
        email: `sender-${uniqueId}@example.com`,
        name: "Test Sender",
      },
    });

    // 3. Create a campaign
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        senderId: sender.id,
        subject: "ReachInbox End-to-End Test",
        body: "This email was sent using BullMQ and Ethereal SMTP.",
        startAt: new Date(),
        delayBetweenEmailsMs: 2000,
        hourlyLimit: 100,
      },
    });

    // 4. Create an email record
    const email = await prisma.email.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        senderId: sender.id,
        recipient: "test@example.com",
        subject: "ReachInbox End-to-End Test",
        body: "Hello! Your ReachInbox email pipeline is working.",
        scheduledAt: new Date(),
        idempotencyKey: `test-email-${uniqueId}`,
      },
    });

    console.log("Database records created.");
    console.log("Email ID:", email.id);
    console.log("Initial status:", email.status);

    // 5. Add email to BullMQ
    const job = await emailQueue.add(
      "send-email",
      { emailId: email.id },
      { jobId: email.id }
    );

    console.log("BullMQ job added:", job.id);
    console.log("Waiting for worker to process the email...");

  } catch (error) {
    console.error("Full email flow test failed:", error);
  } finally {
    await emailQueue.close();
    await redisConnection.quit();
    await prisma.$disconnect();
  }
}

void testFullEmailFlow();