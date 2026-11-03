
import { Client } from "@elastic/elasticsearch";
import { readFileSync } from "node:fs";
import { env } from "./env.js";

export const EMAIL_INDEX = "reachinbox-emails";

export const elasticsearchClient = new Client({
  node: env.ELASTICSEARCH_NODE,
  auth: {
    username: env.ELASTICSEARCH_USERNAME,
    password: env.ELASTICSEARCH_PASSWORD,
  },
  tls: {
    ca: readFileSync(env.ELASTICSEARCH_CA_CERT),
    rejectUnauthorized: true,
  },
});

let indexInitialization: Promise<void> | null = null;

export async function ensureEmailIndex(): Promise<void> {
  if (!indexInitialization) {
    indexInitialization = (async () => {
      const exists = await elasticsearchClient.indices.exists({
        index: EMAIL_INDEX,
      });

      if (!exists) {
        await elasticsearchClient.indices.create({
          index: EMAIL_INDEX,
          mappings: {
            properties: {
              id: { type: "keyword" },
              userId: { type: "keyword" },
              campaignId: { type: "keyword" },
              senderId: { type: "keyword" },
              recipient: {
                type: "text",
                fields: {
                  keyword: { type: "keyword" },
                },
              },
              subject: { type: "text" },
              body: { type: "text" },
              status: { type: "keyword" },
              scheduledAt: { type: "date" },
              sentAt: { type: "date" },
              createdAt: { type: "date" },
              updatedAt: { type: "date" },
            },
          },
        });
      }
    })().catch((error) => {
      indexInitialization = null;
      throw error;
    });
  }

  return indexInitialization;
}

export async function checkElasticsearchConnection() {
  return elasticsearchClient.info();
}