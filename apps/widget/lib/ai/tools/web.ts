import { tool, UIMessageStreamWriter } from "ai";
import Exa from "exa-js";
import { ChatMessage } from "@/lib/types";
import { z } from "zod";

const exa = new Exa(process.env.EXA_API_KEY || "");

type WebSearchToolProps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const webSearchTool = ({ dataStream }: WebSearchToolProps) =>
  tool({
    description: `Use this tool ONLY as a fallback when the knowledge base results are insufficient (empty, vague, incomplete, or irrelevant). Searches the web for current information. Only call this AFTER you've tried getInformationTool and found the results unsatisfactory.`,
    inputSchema: z.object({
      content: z
        .string()
        .describe(
          "The search query for web search. Use the same or a rephrased version of the user's question."
        ),
    }),
    execute: async ({ content }) => {
      const { results } = await exa.searchAndContents(content, {
        text: true,
        type: "auto",
        numResults: 5,
        // include all domains for now
        // includeDomains can be configured here for deployment-specific sources.
      });

      return results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.text.slice(0, 1000), // take just the first 1000 characters
        publishedDate: result.publishedDate,
      }));
    },
  });
