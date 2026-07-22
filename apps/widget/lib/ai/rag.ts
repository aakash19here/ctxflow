import { index } from "@repo/rpc";
import { client } from "./voyage";
import { RerankResponse } from "voyageai/api";

const fallback = {
  data: [],
} satisfies RerankResponse;

export const findRelevantContent = async (userQuery: string) => {
  try {
    const context = await index.query({
      includeData: true,
      includeMetadata: true,
      topK: 5,
      data: userQuery,
    });

    if (context.length === 0) {
      return fallback;
    }

    const documents = context.map((doc) => doc.data ?? "");

    const results = await client.rerank({
      documents,
      model: "rerank-2.5",
      query: userQuery,
      topK: 3,
      returnDocuments: true,
    });

    // If the reranker returns nothing, fall back to the raw context.
    if (!results.data || results.data.length === 0) {
      return {
        data: documents.map((document, index) => ({
          index,
          document,
        })),
      } satisfies RerankResponse;
    }

    return results;
  } catch (e) {
    return fallback;
  }
};
