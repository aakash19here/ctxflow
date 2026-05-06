"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@repo/ui/components/ai/conversation";
import { AIMessage, AIMessageContent } from "@repo/ui/components/ai/message";
import { PreviewAttachment } from "@repo/ui/components/ai/input";
import { Streamdown } from "streamdown";
import { queryClient } from "@/utils/trpc";
import { formatDate } from "date-fns";

export function UserChats() {
  const { data } = useQuery(
    trpc.analytics.getUserChats.queryOptions({ offset: 0, limit: 10 })
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<
    Array<{
      id: string;
      email: string;
      name: string;
      chats: Array<{
        id: string;
        title: string;
        createdAt: string | Date;
        userId: string;
        messages: Array<{
          id: string;
          role: string;
          parts: any[];
          createdAt: string | Date;
        }>;
      }>;
    }>
  >([]);
  const [nextOffset, setNextOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  type WebMessage = {
    id: string;
    role: string;
    parts: any[];
    createdAt: string | Date;
  };
  type WebChat = {
    id: string;
    title: string;
    createdAt: string | Date;
    userId: string;
    messages: WebMessage[];
  };
  type WebUser = { id: string; email: string; name: string; chats: WebChat[] };

  function normalizeUsers(input: any): WebUser[] {
    const apiUsers = Array.isArray(input?.users) ? input.users : [];
    return apiUsers.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      chats: Array.isArray(u.chats)
        ? u.chats.map((c: any) => ({
            id: c.id,
            title: c.title,
            createdAt: c.createdAt,
            userId: c.userId,
            messages: Array.isArray(c.messages)
              ? c.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  parts: Array.isArray(m.parts) ? m.parts : [],
                  createdAt: m.createdAt,
                }))
              : [],
          }))
        : [],
    }));
  }

  useEffect(() => {
    if (data) {
      const normalized = normalizeUsers(data);
      setUsers(normalized);
      setNextOffset(data.nextOffset ?? 0);
      setHasMore(Boolean(data.hasMore));
    }
  }, [data?.nextOffset]);

  const activeUserId = useMemo(
    () => selectedUserId ?? users[0]?.id ?? null,
    [selectedUserId, users.length]
  );

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) ?? null,
    [activeUserId, users]
  );

  return (
    <div className="mx-5 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUserId(u.id)}
              className={`w-full rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted ${
                u.id === activeUserId ? "border-primary" : "border-border"
              }`}
            >
              <div className="truncate text-sm font-medium">{u.email}</div>
            </button>
          ))}
          {users.length === 0 && (
            <div className="text-muted-foreground text-sm">No users found</div>
          )}
          {hasMore && (
            <div className="pt-2">
              <Button
                size="sm"
                onClick={async () => {
                  if (isLoadingMore) return;
                  setIsLoadingMore(true);
                  try {
                    const next = await queryClient.fetchQuery(
                      trpc.analytics.getUserChats.queryOptions({
                        offset: nextOffset,
                        limit: 10,
                      })
                    );
                    const normalizedNext = normalizeUsers(next);
                    setUsers((prev) => [...prev, ...normalizedNext]);
                    setNextOffset(next.nextOffset ?? nextOffset);
                    setHasMore(Boolean(next.hasMore));
                  } finally {
                    setIsLoadingMore(false);
                  }
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Chats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 h-72 overflow-y-auto">
          {activeUser?.chats?.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {c.messages[0].parts[0].text}
                </div>
              </div>
              {formatDate(c.createdAt, "dd MMMM yyyy")}
              <ChatDialog chat={c} />
            </div>
          ))}
          {(!activeUser || activeUser.chats.length === 0) && (
            <div className="text-muted-foreground text-sm">No chats</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChatDialog({
  chat,
}: {
  chat: {
    id: string;
    title: string;
    messages: Array<{
      id: string;
      role: string;
      parts: any[];
      createdAt: string | Date;
    }>;
  };
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Open
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="truncate">{chat.title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-2 pb-4">
          <AIConversation>
            <AIConversationContent>
              {chat.messages.map((message, index) => (
                <AIMessage
                  from={message.role === "user" ? "user" : "assistant"}
                  key={index}
                >
                  <AIMessageContent>
                    {Array.isArray(message.parts) &&
                      message.parts.map((part: any, i: number) => {
                        const { type } = part ?? {};
                        const key = `message-${message.id}-part-${i}`;
                        if (type === "text" && part.text) {
                          return (
                            <div key={key} className="flex flex-col">
                              <Streamdown>{part.text}</Streamdown>
                              <span className="text-end w-fit ml-auto text-xs">
                                {formatDate(
                                  message.createdAt,
                                  "dd/MM/yyyy , hh:mm aa"
                                )}
                              </span>
                            </div>
                          );
                        }
                        if (type === "file" && part.url) {
                          return (
                            <div
                              key={`image-${message.id}-${i}`}
                              data-testid={`message-attachments`}
                              className="flex flex-row justify-start gap-2"
                            >
                              <PreviewAttachment
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
                        return null;
                      })}
                  </AIMessageContent>
                </AIMessage>
              ))}
            </AIConversationContent>
            <AIConversationScrollButton />
          </AIConversation>
        </div>
      </DialogContent>
    </Dialog>
  );
}
