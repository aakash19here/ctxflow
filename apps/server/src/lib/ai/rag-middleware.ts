import { groq } from "@ai-sdk/groq";
import { LanguageModelV2Middleware } from "@ai-sdk/provider";
import { generateObject, generateText } from "ai";
import { findRelevantContent } from "../rag";

export const ragMiddleware: LanguageModelV2Middleware = {
  transformParams: async ({ params }) => {
    const { prompt: messages } = params;

    const recentMessage = messages.pop();

    if (!recentMessage || recentMessage.role !== "user") {
      if (recentMessage) {
        messages.push(recentMessage);
      }

      return params;
    }

    const lastUserMessageContent = recentMessage.content
      .filter((content) => content.type === "text")
      .map((content) => content.type === "text" && content.text)
      .join("\n");

    const { object: classification } = await generateObject({
      // fast model for classification:
      model: groq("openai/gpt-oss-20b"),
      output: "enum",
      enum: ["question", "statement", "other"],
      system:
        "classify the user message as a question, statement, or other. return statement for casual questions like how are you, what is your name, etc.",
      prompt: lastUserMessageContent,
    });

    if (classification !== "question") {
      messages.push(recentMessage);
      return params;
    }

    const { text: rePromptedText } = await generateText({
      model: groq("openai/gpt-oss-20b"),
      messages: [
        {
          role: "system",
          content: `
            Conversation history:
            ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

            The user's latest message is: ${lastUserMessageContent}

            Rephrase the latest message into a clear, standalone question or statement for searching similar content. Incorporate key details from the history if needed. Keep it short (under 30 words), natural, and human-sounding. Do not add extra explanations.
          `,
        },
      ],
    });

    const relavantChunks = await findRelevantContent(rePromptedText);

    messages.push({
      role: "user",
      content: [
        ...recentMessage.content,
        {
          type: "text",
          text: "Here is some relevant information from the document that you can use to answer the question: \n\n Page: [PAGE_NUMBER](PAGE_NUMBER)",
        },
        ...relavantChunks.map((chunk) => ({
          type: "text" as const,
          text: `Content: ${chunk?.data}`,
        })),
      ],
    });

    return { ...params, prompt: messages };
  },
};
