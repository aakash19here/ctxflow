import Dexie, { Table } from "dexie";

export type DBMessage = {
  id: string;
  createdAt: Date;
  chatId: string;
  role: string;
  parts: unknown;
  attachments: unknown;
};

class MessagesDB extends Dexie {
  // Primary key is the message id (string)
  messages!: Table<DBMessage, string>;

  constructor() {
    super("ctxflow_db");

    // v1 schema: id as PK; indexes on createdAt, chatId, role, and a compound index for (chatId + createdAt)
    this.version(1).stores({
      // Syntax: 'primaryKey, index1, index2, ..., [compoundIndexField1+field2]'
      messages: "id, createdAt, chatId, role, [chatId+createdAt]",
    });
  }
}

let _db: MessagesDB | null = null;

export function getDB(): MessagesDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB/Dexie is only available in the browser.");
  }
  if (!_db) _db = new MessagesDB();
  return _db;
}

// Create or replace a message
export async function upsertMessage(message: DBMessage): Promise<void> {
  const db = getDB();
  await db.messages.put(message);
}

export async function resetChat() {
  const db = getDB();
  await db.messages.clear();
}
