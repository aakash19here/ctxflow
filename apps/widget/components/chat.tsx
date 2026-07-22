"use client";

import { useChat } from "@ai-sdk/react";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@repo/ui/components/ai/conversation";
import { PreviewAttachment } from "@repo/ui/components/ai/input";
import { AIMessage, AIMessageContent } from "@repo/ui/components/ai/message";
import { ThinkingMessage } from "@repo/ui/components/ai/thinking";
import { Button } from "@repo/ui/components/button";
import { DefaultChatTransport, ToolModelMessage } from "ai";
import { ChatHeader } from "@/components/chat-header";
import { EmptyScreen } from "@/components/empty-screen";
import { ChatMessage, DBMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { useState } from "react";
import { Streamdown } from "streamdown";
import ChatInput from "@/components/chat-input";
import { PromptInputMessage } from "@/components/prompt-input";

import { useDataStream } from "./data-stream-provider";
import { RagSearchLoading } from "./tools/rag-search";
import { WebSearchLoading, WebSearchUI } from "./tools/web-search";

export default function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: ChatMessage[];
}) {
  const [text, setText] = useState<string>("");
  const { setDataStream } = useDataStream();

  const { messages, status, sendMessage, error, regenerate } =
    useChat<ChatMessage>({
      id,
      generateId: generateUUID,
      experimental_throttle: 100,
      messages: initialMessages,
      transport: new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest({ body, messages, id }) {
          return {
            body: {
              id,
              message: messages.at(-1),
              ...body,
            },
          };
        },
      }),
      onData: (dataPart: any) => {
        setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      },
    });

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (status === "streaming" || status === "submitted") {
      return;
    }

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage({
      parts: [
        ...(message.files ?? []).map((f) => ({
          type: "file" as const,
          url: f.url,
          mediaType: f.mediaType,
          name: f.filename,
        })),
        {
          type: "text",
          text: message.text ?? "",
        },
      ],
    });

    setText("");
  };

  return (
    <>
      <ChatHeader messages={messages as DBMessage[]} status={status} id={id} />
      <AIConversation>
        <AIConversationContent>
          {messages.length === 0 ? <EmptyScreen /> : null}

          {messages.map((message, index) => (
            <AIMessage
              from={message.role === "user" ? "user" : "assistant"}
              key={index}
            >
              <AIMessageContent>
                {message.parts.map((part, i) => {
                  const { type } = part;
                  const key = `message-${message.id}-part-${i}`;
                  if (type === "text") {
                    return (
                      <div key={key}>
                        <Streamdown key={index}>{part.text}</Streamdown>
                      </div>
                    );
                  }
                  if (type === "file") {
                    return (
                      <div
                        key={`image-${message.id}-${i}`}
                        data-testid={`message-attachments`}
                        className="flex flex-row justify-start gap-2"
                      >
                        <PreviewAttachment
                          key={index}
                          attachment={{
                            name: part.filename ?? "file",
                            contentType: part.mediaType as any,
                            url: part.url,
                          }}
                          showTitle={false}
                        />
                      </div>
                    );
                  }
                  if (type === "tool-getInformationTool") {
                    const { toolCallId, state } = part;

                    return (
                      <div key={toolCallId} className="flex">
                        {state === "input-available" && <RagSearchLoading />}
                      </div>
                    );
                  }
                  if (type === "tool-webSearchTool") {
                    const { toolCallId, state, output } = part;

                    return (
                      <div key={toolCallId} className="flex ">
                        {state === "input-available" && <WebSearchLoading />}

                        {state === "output-available" && output.length >= 1 && (
                          <WebSearchUI output={output} />
                        )}
                      </div>
                    );
                  }
                })}
              </AIMessageContent>
            </AIMessage>
          ))}
          {status === "submitted" && (
            <AIMessage from="assistant">
              <AIMessageContent>
                <ThinkingMessage />
              </AIMessageContent>
            </AIMessage>
          )}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>

      <div className="p-1">
        {error && (
          <div
            className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center justify-between gap-2">
              <span>{error.message ?? "An error occurred."}</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => regenerate()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}
        <div className="p-2">
          <ChatInput
            status={status}
            error={error}
            text={text}
            setText={setText}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}
