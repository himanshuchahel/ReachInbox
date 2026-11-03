import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { redisConnection } from "../config/redis.js";
import { prisma } from "../lib/prisma.js";

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

const STATE_TTL_SECONDS = 300;

export async function createGoogleAuthUrl() {
  const state = randomBytes(32).toString("hex");

  await redisConnection.set(
    `oauth:google:state:${state}`,
    "valid",
    "EX",
    STATE_TTL_SECONDS,
    "NX"
  );

  const url = googleClient.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });

  return url;
}

export async function consumeGoogleOAuthState(state: string) {
  // Read and delete atomically so the same state cannot be reused.
  const script = `
    local value = redis.call("GET", KEYS[1])
    if value then
      redis.call("DEL", KEYS[1])
      return value
    end
    return nil
  `;

  const result = await redisConnection.eval(
    script,
    1,
    `oauth:google:state:${state}`
  );

  return result === "valid";
}

export async function authenticateWithGoogle(code: string) {
  const { tokens } = await googleClient.getToken(code);

  if (!tokens.id_token) {
    throw new Error("Google did not return an ID token");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (
    !payload?.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    throw new Error("Google account email could not be verified");
  }

  const user = await prisma.user.upsert({
    where: {
      googleId: payload.sub,
    },
    update: {
      email: payload.email,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture ?? null,
    },
    create: {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture ?? null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return { user, token };
}