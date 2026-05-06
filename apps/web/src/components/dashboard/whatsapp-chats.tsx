"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@repo/ui/components/item";
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
import { Streamdown } from "streamdown";
import { Eye, MessageSquare, Phone } from "lucide-react";

type WhatsAppMessage = {
  role: string;
  content: string;
};

type WhatsAppUser = {
  phoneNumber: string;
  email: string;
  state: string;
  messages: WhatsAppMessage[];
  deletedMessages: WhatsAppMessage[];
  messageCount: number;
  deletedMessageCount: number;
};

export function WhatsAppChats() {
  const { data, isLoading } = useQuery(
    trpc.analytics.getWhatsAppChats.queryOptions()
  );

  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(
    null
  );

  const users = useMemo(() => {
    return data?.users || [];
  }, [data?.users]);

  const activePhoneNumber = useMemo(
    () => selectedPhoneNumber ?? users[0]?.phoneNumber ?? null,
    [selectedPhoneNumber, users.length]
  );

  const activeUser = useMemo(
    () => users.find((u) => u.phoneNumber === activePhoneNumber) ?? null,
    [activePhoneNumber, users]
  );

  return (
    <div className="mx-5 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="size-4" />
            WhatsApp Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : users.length > 0 ? (
            users.map((u) => (
              <button
                key={u.phoneNumber}
                type="button"
                onClick={() => setSelectedPhoneNumber(u.phoneNumber)}
                className={`w-full rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted ${
                  u.phoneNumber === activePhoneNumber
                    ? "border-primary"
                    : "border-border"
                }`}
              >
                <div className="truncate text-sm font-medium">
                  {u.phoneNumber}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {u.email}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {u.messageCount} messages
                </div>
              </button>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">
              No WhatsApp users found
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            Conversation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeUser ? (
            <div className="space-y-3">
              {activeUser.deletedMessages.length > 0 && (
                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle>Deleted Messages</ItemTitle>
                    <ItemDescription>
                      View the deleted messages for this user.
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <DeletedChatDialog user={activeUser} />
                  </ItemActions>
                </Item>
              )}
              <div className="space-y-2 max-h-96 overflow-y-auto rounded-md border border-border p-3">
                {activeUser.messages.length > 0 ? (
                  activeUser.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-sm">
                    No messages
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Select a user to view conversation
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DeletedChatDialog({ user }: { user: WhatsAppUser }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <Eye />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="truncate">
            Chat with {user.phoneNumber}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-2 pb-4">
          <AIConversation>
            <AIConversationContent>
              {user.deletedMessages.map((message, index) => (
                <AIMessage
                  from={message.role === "user" ? "user" : "assistant"}
                  key={index}
                >
                  <AIMessageContent>
                    <div className="flex flex-col">
                      <Streamdown>{message.content}</Streamdown>
                    </div>
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
