import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TRPCError } from "@trpc/server";

type FileTypes =
  | "application/pdf"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function getFileType(type: string) {
  if (type === "application/pdf") return "application/pdf";
  if (type === "application/msword") return "application/msword";
  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Unknown file type",
  });
}

export function getLoader(type: FileTypes, blob: Blob) {
  switch (type) {
    case "application/pdf":
      return new PDFLoader(blob);
    case "application/msword":
      return new DocxLoader(blob, {
        type: "doc",
      });
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return new DocxLoader(blob);
    default:
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Unknown file type",
      });
  }
}
