
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  ELASTICSEARCH_NODE: z
    .string()
    .url()
    .default("https://localhost:9200"),

  ELASTICSEARCH_USERNAME: z.string().min(1),
  ELASTICSEARCH_PASSWORD: z.string().min(1),
  ELASTICSEARCH_CA_CERT: z.string().min(1),

  EMAIL_CONCURRENCY: z.coerce.number().int().positive().default(5),

  EMAIL_MIN_DELAY_MS: z.coerce.number().int().nonnegative().default(2000),

  MAX_EMAILS_PER_HOUR_PER_SENDER: z.coerce
    .number()
    .int()
    .positive()
    .default(100),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),

  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, "GOOGLE_CLIENT_SECRET is required"),

  GOOGLE_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:5000/api/auth/google/callback"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:5000/api/slack/callback"),

  TOKEN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/, "TOKEN_ENCRYPTION_KEY must be 64 hex characters")
    .optional(),
    
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  console.error(z.treeifyError(parsedEnv.error));
  process.exit(1);
}

export const env = parsedEnv.data;
