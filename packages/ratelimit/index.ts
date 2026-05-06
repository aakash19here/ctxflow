import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1m"),
    prefix: "auth",
    analytics: true,
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(600, "1m"),
    prefix: "api",
    analytics: true,
  }),
  chat: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1m"),
    prefix: "chat",
    analytics: true,
  }),
};

export function getRateLimitIdentifier(userId?: string, headers?: Headers) {
  if (userId) {
    return userId;
  }

  const cfConnectingIp = headers?.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const realIp = headers?.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const forwardedFor =
    headers?.get("x-forwarded-for") ?? headers?.get("X-Forwarded-For");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return `anon:${Math.floor(Date.now() / 60000)}`;
}
