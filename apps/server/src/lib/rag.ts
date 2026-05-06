import { index, QueryResult } from "@repo/rpc";
import { VoyageAIClient } from "voyageai";

export const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

export const findRelevantContent = async (userQuery: string) => {
  const context = await index.query({
    includeData: true,
    includeMetadata: true,
    topK: 3,
    data: userQuery,
  });

  const documents = context.map((doc) => doc.data ?? "");

  const results = await client.rerank({
    documents,
    model: "rerank-2.5",
    query: userQuery,
    topK: 3,
    returnDocuments: true,
  });

  return results;
};
