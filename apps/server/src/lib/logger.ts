import pretty from "pino-pretty";

import { pinoLogger } from "hono-pino";
import pino from "pino";

export function logger() {
  const isProduction = process.env.NODE_ENV === "production";
  const shouldPrettyPrint = !isProduction && process.stdout.isTTY;

  return pinoLogger({
    pino: pino(
      {
        level:
          process.env.LOG_LEVEL ??
          (isProduction ? "info" : "debug"),
        timestamp: pino.stdTimeFunctions.unixTime,
        redact: {
          paths: ["req.headers", "res.headers"],
          remove: true,
        },
      },

      !shouldPrettyPrint
        ? undefined
        : pretty({
          colorize: true,
          singleLine: true,
        })
    ),
  });
}
