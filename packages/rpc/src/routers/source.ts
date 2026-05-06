import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ScrapeResponse } from "@mendable/firecrawl-js";
import { db, eq, source } from "@repo/db";
import { TRPCError } from "@trpc/server";
import "dotenv/config";
import { firecrawl } from "../lib/firecrawl";
import {
  deleteSchema,
  serializedFileSchema,
  sourceSchema,
} from "../lib/validators/source";
import { index } from "../lib/vectorStore";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { getFileType, getLoader } from "../lib/utils";

export const sourceRouter = createTRPCRouter({
  list: privateProcedure.query(async ({ ctx }) => {
    const sources = await ctx.db.query.source.findMany();
    return sources;
  }),

  delete: privateProcedure
    .input(deleteSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await Promise.all([
          ctx.db.delete(source).where(eq(source.id, input.id)),
          index.delete({
            prefix: `${input.name}_`,
          }),
        ]);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete source",
        });
      }
    }),

  createWebsite: privateProcedure
    .input(sourceSchema)
    .mutation(async ({ ctx, input }) => {
      const [response] = await ctx.db
        .insert(source)
        .values({
          ...input,
          isDeletable: true,
        })
        .returning();

      const scrapeResult = (await firecrawl.scrapeUrl(input.url, {
        formats: ["markdown"],
        onlyMainContent: true,
        parsePDF: true,
      })) as ScrapeResponse;

      if (!scrapeResult.success || !scrapeResult.markdown) {
        await ctx.db
          .update(source)
          .set({
            status: "failed",
          })
          .where(eq(source.id, response.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to scrape source",
        });
      }

      const spliter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
        chunkOverlap: 200,
        chunkSize: 500,
      });

      const docs = await spliter.createDocuments([scrapeResult.markdown]);

      const formattedDocs = docs.map((doc, id) => ({
        id: `${response.name}_${id}`,
        text: doc.pageContent,
        metadata: {
          ...doc.metadata,
          url: response.url,
        },
      }));

      for (const doc of formattedDocs) {
        await index.upsert({
          id: doc.id,
          data: doc.text,
          metadata: doc.metadata,
        });
      }

      await ctx.db
        .update(source)
        .set({
          status: "success",
        })
        .where(eq(source.id, response.id));

      return response.status;
    }),

  createDocument: privateProcedure
    .input(serializedFileSchema)
    .mutation(async ({ input }) => {
      const fileType = getFileType(input.type);

      const [dbFile] = await db
        .select()
        .from(source)
        .where(eq(source.name, input.name));

      if (dbFile?.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "File already exists",
        });
      }

      const pdfBuffer = Buffer.from(input.base64, "base64");
      const blob = new Blob([pdfBuffer], { type: fileType });

      const loader = getLoader(fileType, blob);

      const docs = await loader.load();

      if (docs.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This pdf requires OCR",
        });
      }

      if (
        fileType === "application/pdf" &&
        docs[0].metadata.pdf.totalPages > 20
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "PDF more than 20 pages are not supported",
        });
      }

      const spliter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
      });

      const chunkedDocs = await spliter.splitDocuments(docs);

      const formattedChunks = chunkedDocs.map((chunk, index) => ({
        id: `${input.name}_${index}`,
        content: chunk.pageContent,
        metadata: {
          source: input.name,
        },
      }));

      for (const doc of formattedChunks) {
        try {
          await index.upsert({
            id: doc.id,
            data: doc.content,
            metadata: doc.metadata,
          });
        } catch (e) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error while ingesting",
          });
        }
      }

      await db.insert(source).values({
        name: input.name,
        type: "document",
        url: "",
        status: "success",
        isDeletable: true,
      });

      return "success";
    }),
});
