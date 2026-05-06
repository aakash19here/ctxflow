import * as Sentry from "@sentry/node";
// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://48769eb209a94c94744381a2cdc33f35@o4508851502448640.ingest.de.sentry.io/4509994433642576",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/hono/configuration/options/#sendDefaultPii

  integrations: [
    Sentry.consoleLoggingIntegration({
      levels: ["error", "warn", "log"],
    }),
  ],

  sendDefaultPii: true,
  //  profiling
  //  performance
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/hono/configuration/options/#tracesSampleRate
  tracesSampleRate: 1,
  //  performance
  //  profiling
  // Set profilesSampleRate to 1.0 to profile 100%
  // of sampled transactions.
  // This is relative to tracesSampleRate
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/hono/configuration/options/#profilesSampleRate
  profilesSampleRate: 1,
  //  profiling
  //  logs
  // Enable logs to be sent to Sentry
  enableLogs: true,
  //  logs
});
