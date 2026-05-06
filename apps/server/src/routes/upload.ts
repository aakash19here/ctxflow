import { z } from "zod";
import { createRouter } from "../lib/create-app";
import { put } from "@vercel/blob";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "application/pdf"].includes(file.type),
      {
        message: "File type should be JPEG or PNG",
      }
    ),
});

export const upload = createRouter().post("/files/upload", async (c) => {
  const formData = await c.req.formData();

  const file = formData.get("file") as Blob;

  if (!file) {
    return c.json({ error: "No file uploaded" }, { status: 400 });
  }

  const validatedFile = FileSchema.safeParse({ file });

  if (!validatedFile.success) {
    const errorMessage = z.treeifyError(validatedFile.error).properties?.file
      ?.errors?.[0];
    return c.json({ error: errorMessage }, { status: 400 });
  }

  const filename = (formData.get("file") as File).name;
  const fileBuffer = await file.arrayBuffer();

  try {
    const data = await put(`${filename}`, fileBuffer, {
      access: "public",
      addRandomSuffix: true,
    });

    return c.json(data);
  } catch (error) {
    console.log(error);
    return c.json({ error: "Upload failed" }, { status: 500 });
  }
});
