import { VoyageAIClient } from "voyageai";

export const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});
