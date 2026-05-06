import { auth } from "@repo/auth/src";
import Chat from "components/chat";
import {
  getChatById,
  getFirstUserChat,
  getMessagesByChatId,
} from "lib/queries";
import { ChatMessage } from "lib/types";
import { convertToUIMessages, generateUUID } from "lib/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function ChatPage() {
  let id = generateUUID();

  let initialMessages: ChatMessage[] = [];

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user.id) {
    redirect("/login");
  }

  const firstChat = await getFirstUserChat({ userId: session.user.id });

  if (firstChat) {
    id = firstChat.id;

    const messagesFromDb = await getMessagesByChatId({
      id,
    });

    const uiMessages = convertToUIMessages(messagesFromDb);

    initialMessages = uiMessages;
  }

  return <Chat id={id} initialMessages={initialMessages} />;
}
