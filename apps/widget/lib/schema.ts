import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  name: z.string().min(1).max(100),
  url: z.url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  id: z.string(),
  message: z.object({
    id: z.string(),
    role: z.enum(["user"]),
    parts: z.array(partSchema),
  }),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;

export const providerOptionsSchema = z.object({
  session: z.object({
    email: z.email(),
  }),
});
