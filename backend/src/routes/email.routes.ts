import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

const statusSchema = z.enum([
  "SCHEDULED",
  "PROCESSING",
  "SENT",
  "FAILED",
]);

// GET /api/emails/stats
router.get("/stats", authenticate, async (_req, res) => {
  try {
    const userId = res.locals.userId as string;

    const results = await prisma.email.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    });

    const stats = {
      total: 0,
      scheduled: 0,
      processing: 0,
      sent: 0,
      failed: 0,
    };

    for (const result of results) {
      const count = result._count._all;
      stats.total += count;

      switch (result.status) {
        case "SCHEDULED":
          stats.scheduled = count;
          break;
        case "PROCESSING":
          stats.processing = count;
          break;
        case "SENT":
          stats.sent = count;
          break;
        case "FAILED":
          stats.failed = count;
          break;
      }
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Email stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch email statistics",
    });
  }
});

// GET /api/emails
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId as string;

    const querySchema = z.object({
      status: statusSchema.optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
    });

    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parsed.error.flatten(),
      });
    }

    const { status, page, limit } = parsed.data;

    const where = {
      userId,
      ...(status ? { status } : {}),
    };

    const [emails, total] = await prisma.$transaction([
      prisma.email.findMany({
        where,
        include: {
          campaign: {
            select: {
              id: true,
              subject: true,
            },
          },
          sender: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.email.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: emails,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Email listing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch emails",
    });
  }
});

// GET /api/emails/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId as string;
    const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

    const email = await prisma.email.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        campaign: {
          select: {
            id: true,
            subject: true,
            status: true,
            startAt: true,
          },
        },
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: email,
    });
  } catch (error) {
    console.error("Email detail error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch email details",
    });
  }
});

export default router;
