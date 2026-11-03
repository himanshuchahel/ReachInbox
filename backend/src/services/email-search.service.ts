
import { elasticsearchClient, EMAIL_INDEX, ensureEmailIndex } from "../config/elasticsearch.js";

interface EmailSearchInput {
  id: string;
  userId: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function indexEmail(email: EmailSearchInput) {
  await ensureEmailIndex();

  await elasticsearchClient.index({
    index: EMAIL_INDEX,
    id: email.id,
    document: {
      ...email,
      scheduledAt: email.scheduledAt.toISOString(),
      sentAt: email.sentAt?.toISOString() ?? null,
      createdAt: email.createdAt.toISOString(),
      updatedAt: email.updatedAt.toISOString(),
    },
  });
}
