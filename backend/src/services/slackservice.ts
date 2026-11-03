import { prisma } from "../lib/prisma.js";
import { decryptSecret } from "./encryptionservice.js";

export async function sendSlackNotification(
  userId: string,
  message: string
): Promise<void> {
  const integration = await prisma.slackIntegration.findUnique({
    where: { userId },
  });

  if (!integration) {
    console.log(`Slack is not connected for user ${userId}`);
    return;
  }

  const webhookUrl = decryptSecret(
    integration.accessTokenEncrypted
  );

  if (!webhookUrl.startsWith("https://hooks.slack.com/services/")) {
    throw new Error("Invalid Slack webhook URL");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: message,
    }),
  });

  const responseText = await response.text();

  if (!response.ok || responseText !== "ok") {
    throw new Error(
      `Slack notification failed: ${response.status} ${responseText}`
    );
  }

  console.log(`Slack notification sent for user ${userId}`);
}