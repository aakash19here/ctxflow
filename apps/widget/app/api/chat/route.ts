import { auth } from "@repo/auth";
import { rateLimiters } from "@repo/ratelimit";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  stepCountIs,
  streamText,
  toUIMessageStream,
  wrapLanguageModel,
} from "ai";
import { regularPromptWithWebSearch } from "@/lib/ai/prompts";
import { ChatSDKError } from "@/lib/errors";

import * as Sentry from "@sentry/nextjs";
import { getModel } from "@/lib/ai/llm";
import { ragMiddleware } from "@/lib/ai/middleware";
import { webSearchTool } from "@/lib/ai/tools";
import { markdownJoinerTransform } from "@/lib/parser";
import { phClient } from "@/lib/posthog";
import {
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from "@/lib/queries";
import { PostRequestBody, postRequestBodySchema } from "@/lib/schema";
import { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    throw new ChatSDKError("bad_request:api");
  }

  try {
    const {
      id,
      message,
    }: {
      id: string;
      message: ChatMessage;
    } = requestBody;

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || !session?.user.id) {
      throw new ChatSDKError("unauthorized:chat");
    }

    const { success } = await rateLimiters.chat.limit(session.user.id);

    if (!success) {
      throw new ChatSDKError("rate_limit:chat");
    }

    const chat = await getChatById({ id });

    if (!chat) {
      await saveChat({
        id,
        userId: session.user.id,
        title: "",
      });
    } else {
      if (chat.userId !== session.user.id) {
        throw new ChatSDKError("forbidden:chat");
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });

    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const modelMessages = (await convertToModelMessages(uiMessages));

    const model = getModel(session.user.email);

    const customModel = wrapLanguageModel({
      model: model,
      middleware: ragMiddleware,
    });

    const stream = createUIMessageStream<ChatMessage>({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: customModel,
          messages: modelMessages,
          maxRetries: 10,
          onAbort: ({ steps }) => {
            console.log('Stream aborted after', steps.length, 'steps');
          },
          // todo: improve tool prompts
          system: regularPromptWithWebSearch,
          stopWhen: stepCountIs(5),
          experimental_transform: markdownJoinerTransform(),
          providerOptions: {
            groq: {
              parallelToolCalls: false,
            },
            openai: {
              parallelToolCalls: false,
            },
          },
          tools: {
            webSearchTool,
          },
          onFinish: async () => {
            await phClient.shutdown();
          },
        });

        result.consumeStream();

        dataStream.merge(toUIMessageStream({stream: result.stream}));
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((currentMessage) => ({
            id: currentMessage.id,
            role: currentMessage.role,
            parts: currentMessage.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError(error) {
        Sentry.captureException(error);
        return "Oops, an error occurred!";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    if (error instanceof ChatSDKError) {
      Sentry.captureException(error);
      return error.toResponse();
    }

    Sentry.captureException(error);

    return Response.json("Something went wrong", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { chatId } = await request.json();

    if (!chatId) {
      throw new ChatSDKError("bad_request:api");
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw new ChatSDKError("unauthorized:chat");
    }

    const chat = await getChatById({ id: chatId });

    if (chat.userId !== session.user.id) {
      throw new ChatSDKError("forbidden:chat");
    }

    const deletedChat = await deleteChatById({ id: chatId });

    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      Sentry.captureException(error);
      return error.toResponse();
    }

    Sentry.captureException(error);

    return Response.json("Something went wrong", { status: 500 });
  }
}
