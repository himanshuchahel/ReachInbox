
import { redisConnection } from "../config/redis.js";

const RATE_LIMIT_SCRIPT = `
local now = tonumber(ARGV[1])
local hourlyLimit = tonumber(ARGV[2])
local minDelayMs = tonumber(ARGV[3])

local count = tonumber(redis.call("GET", KEYS[1]) or "0")

-- Check hourly sending limit
if count >= hourlyLimit then
    local nextHour = (math.floor(now / 3600000) + 1) * 3600000
    return {0, nextHour}
end

-- Check minimum delay between sends
local lastSend = tonumber(redis.call("GET", KEYS[2]) or "0")
local nextAllowed = lastSend + minDelayMs

if lastSend > 0 and now < nextAllowed then
    return {0, nextAllowed}
end

-- Reserve one sending slot atomically
local newCount = redis.call("INCR", KEYS[1])

if newCount == 1 then
    local nextHour = (math.floor(now / 3600000) + 1) * 3600000
    local ttl = math.ceil((nextHour - now) / 1000) + 60
    redis.call("EXPIRE", KEYS[1], ttl)
end

redis.call("SET", KEYS[2], now, "EX", 86400)

return {1, now}
`;

interface RateLimitResult {
  allowed: boolean;
  nextAllowedAt: number;
}

export async function reserveSendSlot(
  senderId: string,
  hourlyLimit: number,
  minDelayMs: number
): Promise<RateLimitResult> {
  const now = Date.now();

  const hourKey =
    `reachinbox:sender:${senderId}:hour:${Math.floor(now / 3600000)}`;

  const lastSendKey =
    `reachinbox:sender:${senderId}:last-send`;

  const result = (await redisConnection.eval(
    RATE_LIMIT_SCRIPT,
    2,
    hourKey,
    lastSendKey,
    now,
    hourlyLimit,
    minDelayMs
  )) as [number, number];

  return {
    allowed: Number(result[0]) === 1,
    nextAllowedAt: Number(result[1]),
  };
}