import { db, sql } from "@repo/db";
import { redis } from "@repo/ratelimit";
import type { PinoLogger } from "hono-pino";

import { createRouter } from "../lib/create-app";

const checkRedis = async (logger: PinoLogger) => {
  try {
    const result = await redis.ping();

    return result === "PONG";
  } catch (error) {
    logger.error(error as Error, "Redis health check failed");
    return false;
  }
};

const checkPostgres = async (logger: PinoLogger) => {
  try {
    await db.execute(sql`SELECT 1`);

    return true;
  } catch (error) {
    logger.error(error as Error, "Postgres health check failed");
    return false;
  }
};

export const health = createRouter().get("/health", async (c) => {
  const [redisOk, postgresOk] = await Promise.all([
    checkRedis(c.var.logger),
    checkPostgres(c.var.logger),
  ]);
  const success = redisOk && postgresOk;
  const status = success ? 200 : 503;

  return new Response(
    JSON.stringify({
      redis: redisOk,
      postgres: postgresOk,
      success,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
});
