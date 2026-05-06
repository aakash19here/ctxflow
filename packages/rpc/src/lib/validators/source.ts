import z from "zod";

export const sourceSchema = z.object({
  name: z.string(),
  type: z.enum(["website", "youtube", "document"]),
  url: z.string(),
});

export const deleteSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const serializedFileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  lastModified: z.number(),
  base64: z.string(),
});
