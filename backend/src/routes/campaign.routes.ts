
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { emailQueue } from "../queues/email.queue.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { enqueueEmailIndex } from "../queues/search-index.queue.js";

const router = Router();

const createCampaignSchema = z.object({
  senderId: z.string().min(1),
  subject: z.string().min(1).max(998),
  body: z.string().min(1),
  recipients: z.array(z.string().trim().email()).min(1).max(5000),
  startAt: z.string().min(1),
  delayBetweenEmailsMs: z.number().int().nonnegative().optional(),
  hourlyLimit: z.number().int().positive().optional(),
});

router.post("/", authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId as string;

    const parsed = createCampaignSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign data",
        errors: parsed.error.issues,
      });
    }

    const data = parsed.data;
    const startAt = new Date(data.startAt);

    if (Number.isNaN(startAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startAt date",
      });
    }

    const recipients = [
      ...new Set(data.recipients.map((email) => email.toLowerCase())),
    ];

    const sender = await prisma.sender.findFirst({
      where: {
        id: data.senderId,
        userId,
        isActive: true,
      },
    });

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Active sender not found for this user",
      });
    }

    const delayBetweenEmailsMs =
      data.delayBetweenEmailsMs ?? sender.minDelayMs;

    const hourlyLimit = Math.min(
      data.hourlyLimit ?? sender.hourlyLimit,
      sender.hourlyLimit
    );

    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          userId,
          senderId: data.senderId,
          subject: data.subject,
          body: data.body,
          startAt,
          delayBetweenEmailsMs,
          hourlyLimit,
          status: "SCHEDULED",
        },
      });

      const emails = await Promise.all(
        recipients.map((recipient, index) => {
          const scheduledAt = new Date(
            startAt.getTime() + index * delayBetweenEmailsMs
          );

          return tx.email.create({
            data: {
              campaignId: campaign.id,
              userId,
              senderId: data.senderId,
              recipient,
              subject: data.subject,
              body: data.body,
              scheduledAt,
              idempotencyKey: `${campaign.id}-${index}`,
            },
          });
        })
      );

      return { campaign, emails };
    });

    // Add email sending jobs to BullMQ.
    await emailQueue.addBulk(
      result.emails.map((email) => ({
        name: "send-email",
        data: {
          emailId: email.id,
        },
        opts: {
          jobId: email.id,
          delay: Math.max(
            0,
            email.scheduledAt.getTime() - Date.now()
          ),
        },
      }))
    );

    // Queue Elasticsearch indexing jobs.
    const indexingResults = await Promise.allSettled(
      result.emails.map((email) => enqueueEmailIndex(email.id))
    );

    const indexingFailures = indexingResults.filter(
      (item) => item.status === "rejected"
    ).length;

    if (indexingFailures > 0) {
      console.error(
        `${indexingFailures} email indexing jobs could not be queued`
      );
    }

    return res.status(201).json({
      success: true,
      message: "Campaign created and scheduled successfully",
      data: {
        campaignId: result.campaign.id,
        totalRecipients: recipients.length,
        delayBetweenEmailsMs,
        hourlyLimit,
        status: result.campaign.status,
        emails: result.emails.map((email) => ({
          id: email.id,
          recipient: email.recipient,
          scheduledAt: email.scheduledAt,
          status: email.status,
        })),
      },
    });
  } catch (error) {
    console.error("Campaign creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create campaign",
    });
  }
});

router.get("/", authenticate, async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            emails: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
