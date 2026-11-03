import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

const createSenderSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  hourlyLimit: z.number().int().positive().max(1000).optional(),
  minDelayMs: z.number().int().nonnegative().optional(),
});

// Create sender for authenticated user
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId as string;

    const parsed = createSenderSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender data",
        errors: parsed.error.issues,
      });
    }

    const data = parsed.data;
    const normalizedEmail = data.email.toLowerCase();

    const existingSender = await prisma.sender.findUnique({
      where: {
        userId_email: {
          userId,
          email: normalizedEmail,
        },
      },
    });

    if (existingSender) {
      return res.status(409).json({
        success: false,
        message: "Sender already exists",
      });
    }

    const sender = await prisma.sender.create({
      data: {
        userId,
        email: normalizedEmail,
        name: data.name,
        hourlyLimit: data.hourlyLimit ?? 100,
        minDelayMs: data.minDelayMs ?? 2000,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Sender created successfully",
      data: sender,
    });
  } catch (error) {
    console.error("Create sender error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create sender",
    });
  }
});

// Get authenticated user's senders
router.get("/", authenticate, async (_req, res) => {
  try {
    const userId = res.locals.userId as string;

    const senders = await prisma.sender.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        hourlyLimit: true,
        minDelayMs: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: senders,
    });
  } catch (error) {
    console.error("Get senders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch senders",
    });
  }
});

// Deactivate only authenticated user's sender
router.patch("/:senderId/deactivate", authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId as string;
    const senderId = Array.isArray(req.params.senderId)
    ? req.params.senderId[0]
    : req.params.senderId;

    if (!senderId) {
    return res.status(400).json({
        success: false,
        message: "Invalid sender ID",
    });
    }

    const sender = await prisma.sender.findFirst({
      where: {
        id: senderId,
        userId,
      },
    });

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    const updatedSender = await prisma.sender.update({
      where: { id: sender.id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Sender deactivated successfully",
      data: updatedSender,
    });
  } catch (error) {
    console.error("Deactivate sender error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate sender",
    });
  }
});

export default router;