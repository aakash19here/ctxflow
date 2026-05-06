import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { LanguageModelV3 } from "@ai-sdk/provider";
import { withTracing } from "@posthog/ai";
import { phClient } from "lib/posthog";

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const openaiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getModel(email: string): LanguageModelV3  {
  const provider = process.env.LLM_MODEL || "openai";

  switch (provider) {
    case "openai":
      return withTracing(openaiClient("gpt-5.2"), phClient, {
        posthogDistinctId: email,
        posthogProperties: {
          environment: process.env.NODE_ENV,
        },
      });

    case "groq":
      return withTracing(groqClient("qwen/qwen3-32b"), phClient, {
        posthogDistinctId: email,
        posthogProperties: {
          environment: process.env.NODE_ENV,
        },
      });

    default:
      throw new Error(`Unsupported Provider ${provider}`);
  }
}
