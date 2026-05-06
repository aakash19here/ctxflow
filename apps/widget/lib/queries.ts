import "server-only";

import { chat, db, message } from "@repo/db";
import { asc, eq, not, like, and } from "drizzle-orm";
import { ChatSDKError } from "./errors";
import { DBMessage } from "./types";

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));

    return selectedChat;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function getFirstUserChat({ userId }: { userId: string }) {
  try {
    const [firstChat] = await db
      .select()
      .from(chat)
      .where(and(eq(chat.userId, userId), not(like(chat.id, "deleted_%"))))
      .orderBy(asc(chat.createdAt))
      .limit(1);

    return firstChat;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get first user chat"
    );
  }
}

// export async function deleteChatById({ id }: { id: string }) {
//   try {
//     await db.delete(message).where(eq(message.chatId, id));
//     await db.delete(stream).where(eq(stream.chatId, id));

//     const [chatsDeleted] = await db
//       .delete(chat)
//       .where(eq(chat.id, id))
//       .returning();
//     return chatsDeleted;
//   } catch (error) {
//     throw new ChatSDKError(
//       "bad_request:database",
//       "Failed to delete chat by id"
//     );
//   }
// }

export async function deleteChatById({ id }: { id: string }) {
  try {
    const [chatsDeleted] = await db
      .update(chat)
      .set({ id: `deleted_${id}` })
      .where(eq(chat.id, id))
      .returning();

    return chatsDeleted;
  } catch (error) {
    console.log(error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}
