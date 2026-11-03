
import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  elasticsearchClient,
  EMAIL_INDEX,
  ensureEmailIndex,
} from "../config/elasticsearch.js";

const router = Router();

const searchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(["SCHEDULED", "PROCESSING", "SENT", "FAILED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get("/", authenticate, async (req, res) => {
  try {
    const parsed = searchSchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid search parameters",
        errors: parsed.error.flatten(),
      });
    }

    const { q, status, page, limit } = parsed.data;
    const userId = res.locals.userId as string;

    await ensureEmailIndex();

    const filters = [
      { term: { userId } },
      ...(status ? [{ term: { status } }] : []),
    ];

    const result = await elasticsearchClient.search({
      index: EMAIL_INDEX,
      from: (page - 1) * limit,
      size: limit,
      track_total_hits: true,
      query: {
        bool: {
          filter: filters,
          ...(q
            ? {
                must: [
                  {
                    multi_match: {
                      query: q,
                      fields: ["recipient", "subject^2", "body"],
                      type: "best_fields",
                      fuzziness: "AUTO",
                    },
                  },
                ],
              }
            : {}),
        },
      },
      sort: [{ scheduledAt: { order: "desc" } }],
    });

    const total =
      typeof result.hits.total === "number"
        ? result.hits.total
        : result.hits.total?.value ?? 0;

    const emails = result.hits.hits
      .map((hit) => hit._source)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Elasticsearch search error:", error);

    return res.status(503).json({
      success: false,
      message: "Email search is temporarily unavailable",
    });
  }
});

export default router;
