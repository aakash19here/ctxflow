import "./lib/instrument";

import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { auth } from "@repo/auth";
import { appRouter, createTRPCContext } from "@repo/rpc";
import "dotenv/config";
import createApp from "./lib/create-app";
import { health } from "./routes/health";
import { upload } from "./routes/upload";
import { whatsappChat, whatsappwebhook } from "./routes/whatsapp";

const app = createApp();

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.route("/", health);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createTRPCContext({ headers: context.req.raw.headers });
    },
  })
);

app.route("/", upload);
app.route("/", whatsappwebhook);
app.route("/", whatsappChat);

app.get("/", (c) => {
  return c.text("200 OK");
});

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 3000),
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
