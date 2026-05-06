import {
  chat,
  count,
  desc,
  eq,
  inArray,
  message,
  source,
  user,
} from "@repo/db";
import { redis } from "@repo/ratelimit";
import { z } from "zod";
import { buildParams } from "../lib/misc";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { Message, UserData } from "../types";

type Result = {
  name: string;
  pageviews: number;
  visitors: 3;
  percentage: number;
  country_code: string;
  country_name: string;
};

const backUpData = [
  {
    name: "United States",
    pageviews: 35,
    visitors: 17,
    percentage: 59,
    country_code: "US",
    country_name: "United States",
  },
  {
    name: "India",
    pageviews: 28,
    visitors: 7,
    percentage: 24,
    country_code: "IN",
    country_name: "India",
  },
  {
    name: "United Kingdom",
    pageviews: 2,
    visitors: 1,
    percentage: 3,
    country_code: "GB",
    country_name: "United Kingdom",
  },
  {
    name: "Sweden",
    pageviews: 1,
    visitors: 1,
    percentage: 3,
    country_code: "SE",
    country_name: "Sweden",
  },
  {
    name: "Hungary",
    pageviews: 1,
    visitors: 1,
    percentage: 3,
    country_code: "HU",
    country_name: "Hungary",
  },
  {
    name: "Canada",
    pageviews: 1,
    visitors: 1,
    percentage: 3,
    country_code: "CA",
    country_name: "Canada",
  },
  {
    name: "Germany",
    pageviews: 1,
    visitors: 1,
    percentage: 3,
    country_code: "DE",
    country_name: "Germany",
  },
];

export const analyticsRouter = createTRPCRouter({
  getCountries: privateProcedure.query(async () => {
    const params = buildParams(process.env.DATABUDDY_WEBSITE_ID ?? "", {
      start_date: "2025-06-18",
      end_date: "2025-09-25",
    });
    const url = `https://api.databuddy.cc/v1/query?${params}`;

    // const response = await axios.post(
    //   url,
    //   {
    //     id: process.env.DATABUDDY_WEBSITE_ID,
    //     parameters: ["country"],
    //     limit: 1000,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.DATABUDDY_API_KEY}`,
    //     },
    //   }
    // );

    return backUpData;
  }),

  getUserCount: privateProcedure.query(async ({ ctx }) => {
    const db = ctx.db;

    const [result] = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.name, ""));

    return result.count;
  }),

  getDocumentCount: privateProcedure.query(async ({ ctx }) => {
    const db = ctx.db;

    const [result] = await db.select({ count: count() }).from(source);

    // +4 for initial ingested documentation
    return result.count + 4;
  }),

  getUserChats: privateProcedure
    .input(
      z
        .object({
          offset: z.number().int().min(0).default(0),
          limit: z.number().int().min(1).max(50).default(10),
        })
        .default({ offset: 0, limit: 10 })
    )
    .query(async ({ ctx, input }) => {
      const { offset, limit } = input;

      // Step 1: fetch users (paginated)
      const users = await ctx.db
        .select()
        .from(user)
        .where(eq(user.name, ""))
        .offset(offset)
        .orderBy(desc(user.createdAt))
        .limit(limit);

      // Step 2: fetch chats for those users
      const userIds = users.map((u) => u.id);
      const chats = userIds.length
        ? await ctx.db
            .select()
            .from(chat)
            .where(inArray(chat.userId, userIds))
            .orderBy(desc(chat.createdAt))
        : [];

      // Step 3: fetch messages for those chats
      const chatIds = chats.map((c) => c.id);
      const messages = chatIds.length
        ? await ctx.db
            .select()
            .from(message)
            .where(inArray(message.chatId, chatIds))
        : [];

      // Step 4: assemble hierarchy manually
      const chatMap = chats.map((c) => ({
        ...c,
        messages: messages
          .filter((m) => m.chatId === c.id)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      }));

      const userMap = users.map((u) => ({
        ...u,
        chats: chatMap.filter((c) => c.userId === u.id),
      }));

      return {
        users: userMap,
        nextOffset: offset + users.length,
        hasMore: users.length === limit,
      };
    }),

  getWhatsAppChats: privateProcedure.query(async () => {
    const userKeys = await redis.keys("user:*");

    const whatsappUsers = await Promise.all(
      userKeys.map(async (userKey) => {
        const phoneNumber = userKey.replace("user:", "");

        // auth state and email
        const userData = await redis.hgetall<UserData>(userKey);

        const chatKey = `chat:${phoneNumber}`;
        const deletedChatKey = `chat:${phoneNumber}:deleted`;
        const chatExists = await redis.exists(chatKey);
        const deletedChatExists = await redis.exists(deletedChatKey);

        let messages: Message[] = [];
        let deletedMessages: Message[] = [];
        if (chatExists) {
          messages = (await redis.lrange(chatKey, 0, -1)) as Message[];
        }
        if (deletedChatExists) {
          deletedMessages = (await redis.lrange(
            deletedChatKey,
            0,
            -1
          )) as Message[];
        }

        return {
          phoneNumber,
          email: userData?.email ?? "",
          state: userData?.state ?? "",
          messages,
          messageCount: messages.length,
          deletedMessageCount: deletedMessages.length,
          deletedMessages,
        };
      })
    );

    const usersWithChats = whatsappUsers
      .filter((user) => user.messageCount > 0)
      .sort((a, b) => b.messageCount - a.messageCount);

    return {
      users: usersWithChats,
      totalUsers: usersWithChats.length,
    };
  }),
});
