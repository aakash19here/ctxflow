"use client";

import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type DBMessage } from "@/lib/db";

export function useChatMessages(chatId: string) {
  const result = useLiveQuery<DBMessage[] | undefined>(async () => {
    const db = getDB();
    if (!chatId) return [];
    return db.messages
      .where("[chatId+createdAt]")
      .between([chatId, Dexie.minKey], [chatId, Dexie.maxKey])
      .toArray();
  }, [chatId]);

  const isLoading = result === undefined;
  const rows = result ?? [];

  return { rows, isLoading };
}
