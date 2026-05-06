import { requestId } from "hono/request-id";
import { notFound, serveEmojiFavicon } from "stoker/middlewares";
import type { AppBindings } from "./types";
import { Hono } from "hono";
import { logger } from "./logger";
import { cors } from "hono/cors";
import type { Context, ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { INTERNAL_SERVER_ERROR, OK } from "../constants/http-status-codes";
import * as Sentry from "@sentry/node";

function isTruthy(value: string | undefined) {
  return value === "1" || value === "true";
}

function shouldLogHttpRequests() {
  if (isTruthy(process.env.HTTP_LOGS)) {
    return true;
  }

  return process.env.NODE_ENV === "production";
}

const onError: ErrorHandler = (err, c: Context<AppBindings>) => {
  const currentStatus =
    "status" in err ? err.status : c.newResponse(null).status;
  const statusCode =
    currentStatus !== OK
      ? (currentStatus as ContentfulStatusCode)
      : INTERNAL_SERVER_ERROR;
  const env = process.env?.NODE_ENV;

  if (env === "production") {
    Sentry.captureException(err);
  }

  return c.json(
    {
      message: err.message,

      stack: env === "production" ? undefined : err.stack,
    },
    statusCode
  );
};

export function createRouter() {
  return new Hono<AppBindings>({
    strict: false,
  });
}

export default function createApp() {
  const app = createRouter();
  app
    .use(requestId())
    .use(serveEmojiFavicon("📝"));

  if (shouldLogHttpRequests()) {
    app.use(logger());
  }

  app
    .use(
      "/*",
      cors({
        origin: [
          process.env.CORS_ORIGIN ?? "",
          "https://ctxflow.example.com",
          ...(process.env.NODE_ENV === "development"
            ? [
              "http://localhost:3001",
              "http://localhost:3002",
              "http://localhost:5173",
              "http://localhost:5501",
              "http://localhost:3002",
            ]
            : []),
        ],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      })
    );

  app.notFound(notFound);
  app.onError(onError);
  return app;
}
