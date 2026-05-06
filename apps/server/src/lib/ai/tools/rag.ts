import { tool } from "ai";
import { z } from "zod";
import { findRelevantContent } from "../../rag";

export const getInformationTool = tool({
  description: `ALWAYS use this tool FIRST for any question related to the configured knowledge base. This searches indexed source material such as documentation, policies, programs, and resources. You MUST call this before considering any other information source for knowledge-base-related queries.`,
  inputSchema: z.object({
    content: z
      .string()
      .describe(
        "A clear, standalone question about the configured knowledge base. Rephrase implicit or conversational queries into specific questions."
      ),
  }),

  execute: async ({ content }) => {
    const relavantChunks = await findRelevantContent(content);

    if (relavantChunks.data?.length === 0 || !relavantChunks.data) {
      return "No relevant Information Found";
    }

    const formattedResults = relavantChunks.data
      .map((chunk, i) => `[${i + 1}] ${chunk.document}`)
      .join("\n\n");

    return formattedResults;
  },
});
