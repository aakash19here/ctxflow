"use client";

import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@repo/ui/components/ai/conversation";
import {
  AIInput,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
} from "@repo/ui/components/ai/input";
import { AIMessage, AIMessageContent } from "@repo/ui/components/ai/message";
import { AIResponse } from "@repo/ui/components/ai/response";
import { Landmark } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "../button";

const Chat = () => {
  const [text, setText] = useState<string>("");
  const { messages, status, sendMessage, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: process.env.NEXT_PUBLIC_CHAT_API_URL ?? "/api/chat",
    }),
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!text) {
      return;
    }

    sendMessage({ text });
    setText("");
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="shrink-0 flex items-center gap-2 border-b bg-white py-3 px-2.5">
        <Landmark />
        CtxFlow
      </header>

      <AIConversation>
        <AIConversationContent>
          {messages.length === 0 && (
            <div className="flex flex-col gap-2 mt-[50%] translate-y-[-50%]">
              <div className="flex flex-col items-center">
                <Landmark className="size-6 text-primary" />
                <h1 className="text-xl">CtxFlow</h1>
              </div>
              <p className="text-muted-foreground text-center text-base">
                This is an AI chatbot powered by CtxFlow to help you with
                questions about your knowledge base.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <AIMessage
              from={message.role === "user" ? "user" : "assistant"}
              key={index}
            >
              <AIMessageContent>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <div key={`${message.id}-${i}`}>
                          <AIResponse>{part.text}</AIResponse>
                        </div>
                      );
                  }
                })}
              </AIMessageContent>

              {/* error UI moved to global banner below conversation */}
            </AIMessage>
          ))}
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
        <AIInput onSubmit={handleSubmit} className="flex items-center">
          <AIInputTextarea
            onChange={(e) => setText(e.target.value)}
            value={text}
            disabled={error != null}
          />
          <AIInputToolbar>
            <AIInputSubmit
              disabled={!text || error != null}
              status={status}
              variant={"ghost"}
            />
          </AIInputToolbar>
        </AIInput>
      </div>
    </div>
  );
};
export default Chat;
