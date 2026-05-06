import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import { getInformationTool, webSearchTool } from "./ai/tools";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type WebSearchTool = InferUITool<ReturnType<typeof webSearchTool>>;
export type GetInformationTool = InferUITool<typeof getInformationTool>;

export type ChatTools = {
  webSearchTool: WebSearchTool;
  getInformationTool: GetInformationTool;
};

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type CustomUIDataTypes = {
  appendMessage: string;
  id: string;
  query_completion: {
    query: string;
    index: number;
    total: number;
    status: "started" | "completed" | "error";
    resultsCount: number;
  };
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export type DBMessage = {
  id: string;
  createdAt: Date;
  chatId: string;
  role: string;
  parts: unknown;
  attachments: unknown;
};

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";
