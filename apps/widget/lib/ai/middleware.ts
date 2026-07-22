import { groq } from "@ai-sdk/groq";
import { LanguageModelV3Middleware } from "@ai-sdk/provider";
import { generateText, LanguageModelMiddleware, Output } from "ai";
import { findRelevantContent } from "./rag";

export const ragMiddleware: LanguageModelMiddleware = {
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

    const { text: classification } = await generateText({
      // fast model for classification:
      model: groq("openai/gpt-oss-20b"),
      output: Output.choice({ options: ["question", "statement", "other"] as const , description: "The type of the user message" }),
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

    if (relavantChunks.data?.length === 0 || !relavantChunks.data) {
      return { ...params, prompt: messages };
    }

    const formattedResults = relavantChunks?.data
      .map((chunk, i) => `[${i + 1}] ${chunk.document}`)
      .join("\n\n");

    messages.push({
      role: "user",
      content: [
        ...recentMessage.content,
        {
          type: "text",
          text: `Here is some relevant information from the document that you can use to answer the question: \n\n ${formattedResults}`,
        },
      ],
    });

    return { ...params, prompt: messages };
  },
};
