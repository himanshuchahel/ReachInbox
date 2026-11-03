
import { Router } from "express";
import { randomBytes } from "node:crypto";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../config/redis.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { encryptSecret } from "../services/encryptionservice.js";
import { sendSlackNotification } from "../services/slackservice.js";

const router = Router();

function getSlackConfig() {
  if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
    throw new Error("Slack OAuth credentials are not configured");
  }

  return {
    clientId: env.SLACK_CLIENT_ID,
    clientSecret: env.SLACK_CLIENT_SECRET,
    redirectUri: env.SLACK_REDIRECT_URI,
  };
}


// GET /api/slack/connect
router.get("/connect", authenticate, async (_req, res) => {
  try {
    const config = getSlackConfig();
    const userId = res.locals.userId as string;

    const state = randomBytes(32).toString("hex");

    await redisConnection.set(
      `oauth:slack:state:${state}`,
      userId,
      "EX",
      300,
      "NX"
    );

    const params = new URLSearchParams({
      client_id: config.clientId,
      scope: "incoming-webhook",
      redirect_uri: config.redirectUri,
      state,
    });

    const authUrl =
      `https://slack.com/oauth/v2/authorize?${params.toString()}`;

    return res.status(200).json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error("Slack connect error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to initiate Slack connection",
    });
  }
});


// GET /api/slack/callback

router.get("/callback", async (req, res) => {
  const frontendUrl = "http://localhost:5173/integrations";

  try {
    const code = req.query.code;
    const state = req.query.state;
    const oauthError = req.query.error;

    if (oauthError) {
      return res.redirect(`${frontendUrl}?slack=denied`);
    }

    if (typeof code !== "string" || typeof state !== "string") {
      return res.redirect(`${frontendUrl}?slack=invalid_callback`);
    }

    // Atomically consume OAuth state
    const script = `
      local value = redis.call("GET", KEYS[1])
      if value then
        redis.call("DEL", KEYS[1])
        return value
      end
      return nil
    `;

    const userId = await redisConnection.eval(
      script,
      1,
      `oauth:slack:state:${state}`
    );

    if (typeof userId !== "string") {
      return res.redirect(`${frontendUrl}?slack=invalid_state`);
    }

    const config = getSlackConfig();

    // Exchange OAuth code for Slack installation details
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    });

    const response = await fetch(
      "https://slack.com/api/oauth.v2.access",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const result = await response.json() as {
      ok: boolean;
      error?: string;
      team?: {
        id?: string;
        name?: string;
      };
      bot_user_id?: string;
      incoming_webhook?: {
        url?: string;
        channel_id?: string;
        channel_name?: string;
      };
    };

    if (!response.ok || !result.ok) {
      throw new Error(result.error ?? "Slack OAuth exchange failed");
    }

    const webhookUrl = result.incoming_webhook?.url;

    if (
      !webhookUrl ||
      !webhookUrl.startsWith("https://hooks.slack.com/services/")
    ) {
      throw new Error("Slack did not return a valid incoming webhook");
    }

    const encryptedWebhook = encryptSecret(webhookUrl);

    await prisma.slackIntegration.upsert({
      where: { userId },
      update: {
        teamId: result.team?.id ?? null,
        teamName: result.team?.name ?? null,
        botUserId: result.bot_user_id ?? null,
        accessTokenEncrypted: encryptedWebhook,
        connectedAt: new Date(),
      },
      create: {
        userId,
        teamId: result.team?.id ?? null,
        teamName: result.team?.name ?? null,
        botUserId: result.bot_user_id ?? null,
        accessTokenEncrypted: encryptedWebhook,
      },
    });

    return res.redirect(`${frontendUrl}?slack=connected`);
  } catch (error) {
    console.error("Slack OAuth callback error:", error);
    return res.redirect(`${frontendUrl}?slack=error`);
  }
});


// GET /api/slack/status
router.get("/status", authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId as string;

    const integration = await prisma.slackIntegration.findUnique({
      where: { userId },
      select: {
        teamId: true,
        teamName: true,
        connectedAt: true,
      },
    });

    return res.json({
      success: true,
      connected: Boolean(integration),
      data: integration,
    });
  } catch (error) {
    console.error("Slack status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve Slack status",
    });
  }
});

// POST /api/slack/test
router.post("/test", authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId as string;

    await sendSlackNotification(
      userId,
      "ReachInbox connected successfully! Slack notifications are working."
    );

    return res.json({
      success: true,
      message: "Test Slack notification sent",
    });
  } catch (error) {
    console.error("Slack test error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send Slack test notification",
    });
  }
});

export default router;
