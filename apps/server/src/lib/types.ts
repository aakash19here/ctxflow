import type { PinoLogger } from "hono-pino";

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
  };
}
export type AppRouteHandler = AppBindings;

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text: { body: string };
  type: string;
}
