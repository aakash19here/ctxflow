import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { LanguageModelV4 } from "@ai-sdk/provider";


const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const openaiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getModel(email: string): LanguageModelV4  {
  const provider = process.env.LLM_MODEL || "openai";

  switch (provider) {
    case "openai":
      return openaiClient("gpt-4o");

    case "groq":
      return groqClient("qwen/qwen3-32b");

    default:
      throw new Error(`Unsupported Provider ${provider}`);
  }
}
