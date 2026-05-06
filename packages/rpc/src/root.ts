import { analyticsRouter } from "./routers/analytics";
import { sourceRouter } from "./routers/source";

import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  source: sourceRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
