
import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { emailQueue } from "../queues/email.queue.js";
import { enqueueEmailIndex } from "../queues/search-index.queue.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const emailSchema = z.string().email();

router.post(
  "/:campaignId/upload",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      const userId = res.locals.userId as string;

      const campaignId = Array.isArray(req.params.campaignId)
        ? req.params.campaignId[0]
        : req.params.campaignId;

      if (!campaignId) {
        return res.status(400).json({
          success: false,
          message: "Invalid campaign ID",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a CSV or TXT file",
        });
      }

      const extension = req.file.originalname
        .split(".")
        .pop()
        ?.toLowerCase();

      if (!["csv", "txt"].includes(extension ?? "")) {
        return res.status(400).json({
          success: false,
          message: "Only CSV and TXT files are supported",
        });
      }

      // 1. Verify campaign ownership
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          userId,
        },
        include: {
          sender: true,
        },
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      if (!campaign.sender.isActive) {
        return res.status(400).json({
          success: false,
          message: "Campaign sender is inactive",
        });
      }

      // 2. Extract email addresses
      const content = req.file.buffer.toString("utf-8");
      let extractedEmails: string[] = [];

      if (extension === "txt") {
        extractedEmails = content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
      } else {
        const records = parse(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,
        }) as Record<string, string>[];

        extractedEmails = records
          .map((record) => {
            const key = Object.keys(record).find(
              (column) => column.toLowerCase().trim() === "email"
            );

            return key ? record[key] : "";
          })
          .filter(Boolean);
      }

      if (extractedEmails.length > 5000) {
        return res.status(400).json({
          success: false,
          message: "Maximum 5000 recipients allowed per upload",
        });
      }

      // 3. Validate and normalize
      const validEmails = [
        ...new Set(
          extractedEmails
            .map((email) => email.trim().toLowerCase())
            .filter((email) => emailSchema.safeParse(email).success)
        ),
      ];

      if (validEmails.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid email addresses found",
        });
      }

      // 4. Find existing recipients
      const existing = await prisma.email.findMany({
        where: {
          campaignId,
          recipient: {
            in: validEmails,
          },
        },
        select: {
          recipient: true,
        },
      });

      const existingEmails = new Set(
        existing.map((email) => email.recipient.toLowerCase())
      );

      const newEmails = validEmails.filter(
        (email) => !existingEmails.has(email)
      );

      if (newEmails.length === 0) {
        return res.status(200).json({
          success: true,
          message: "All recipients already exist in this campaign",
          data: {
            uploaded: extractedEmails.length,
            valid: validEmails.length,
            duplicates: validEmails.length,
            created: 0,
          },
        });
      }

      // 5. Calculate scheduling times
      const latestEmail = await prisma.email.findFirst({
        where: {
          campaignId,
        },
        orderBy: {
          scheduledAt: "desc",
        },
        select: {
          scheduledAt: true,
        },
      });

      const firstTime = Math.max(
        campaign.startAt.getTime(),
        latestEmail
          ? latestEmail.scheduledAt.getTime() +
              campaign.delayBetweenEmailsMs
          : campaign.startAt.getTime()
      );

      // 6. Create email records
      const createdEmails = await prisma.$transaction(async (tx) => {
        return Promise.all(
          newEmails.map((recipient, index) =>
            tx.email.create({
              data: {
                campaignId,
                userId,
                senderId: campaign.senderId,
                recipient,
                subject: campaign.subject,
                body: campaign.body,
                scheduledAt: new Date(
                  firstTime + index * campaign.delayBetweenEmailsMs
                ),
                idempotencyKey: `${campaignId}-${recipient}`,
              },
            })
          )
        );
      });

      // 7. Schedule emails in BullMQ
      await emailQueue.addBulk(
        createdEmails.map((email) => ({
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

      // 8. Queue Elasticsearch indexing
      const indexingResults = await Promise.allSettled(
        createdEmails.map((email) => enqueueEmailIndex(email.id))
      );

      const indexingFailures = indexingResults.filter(
        (result) => result.status === "rejected"
      ).length;

      if (indexingFailures > 0) {
        console.error(
          `${indexingFailures} email records could not be queued for Elasticsearch indexing`
        );
      }

      return res.status(201).json({
        success: true,
        message: "Leads uploaded and scheduled successfully",
        data: {
          uploaded: extractedEmails.length,
          valid: validEmails.length,
          duplicates: validEmails.length - newEmails.length,
          created: createdEmails.length,
          indexingQueued: indexingResults.length - indexingFailures,
          indexingFailures,
        },
      });
    } catch (error) {
      console.error("Lead upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload leads",
      });
    }
  }
);

export default router;