import { and, eq, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { uploadToS3 } from "@/lib/s3";
import { db } from "@/server/db";
import {
  resourceAttachments,
  resourceCategories,
  resourceContentTypes,
  resources,
  resourcesToCategories,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

// --- Attachment Input Types ---
const attachmentFileSchema = t.Object({
  name: t.String({ minLength: 1 }),
  type: t.Literal("file"),
});

const attachmentUrlSchema = t.Object({
  name: t.String({ minLength: 1 }),
  type: t.Literal("url"),
  url: t.String({ minLength: 1 }),
});

const _attachmentSchema = t.Union([attachmentFileSchema, attachmentUrlSchema]);

export const resourceRoutes = new Elysia({ prefix: "/resources" })
  .use(authorizationPlugin)
  // --- Categories ---
  .get(
    "/categories",
    async () => {
      const categories = await db.query.resourceCategories.findMany();
      return {
        success: true,
        data: categories,
      };
    },
    {
      detail: {
        tags: ["Resources"],
        summary: "List all resource categories",
      },
    },
  )
  .post(
    "/categories",
    async ({ body }) => {
      const { name, description } = body;
      const id = crypto.randomUUID();

      await db.insert(resourceCategories).values({
        id,
        name,
        description: description ?? null,
      });

      return {
        success: true,
        data: { id, name, description },
      };
    },
    {
      auth: true,
      role: "admin",
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resources"],
        summary: "Create a new resource category (Admin Only)",
      },
    },
  )
  // --- Content Types ---
  .get(
    "/content-types",
    async () => {
      const contentTypes = await db.query.resourceContentTypes.findMany();
      return {
        success: true,
        data: contentTypes,
      };
    },
    {
      detail: {
        tags: ["Resources"],
        summary: "List all resource content types",
      },
    },
  )
  .post(
    "/content-types",
    async ({ body }) => {
      const { name, description } = body;
      const id = crypto.randomUUID();

      await db.insert(resourceContentTypes).values({
        id,
        name,
        description: description ?? null,
      });

      return {
        success: true,
        data: { id, name, description },
      };
    },
    {
      auth: true,
      role: "admin",
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resources"],
        summary: "Create a new resource content type (Admin Only)",
      },
    },
  )
  // --- Resources (Listing) ---
  .get(
    "/",
    async ({ query }) => {
      const { category, contentType, search, page, limit } = query;

      const p = page ?? "1";
      const l = limit ?? "10";
      const pageNum = Math.max(1, parseInt(p, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(l, 10) || 10));
      const offset = (pageNum - 1) * limitNum;

      // Get total count for pagination metadata
      const allResources = await db.query.resources.findMany({
        with: {
          contentType: true,
          categories: true,
          uploader: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
          attachments: true,
        },
        where: {
          ...(contentType && { contentTypeId: contentType }),
          ...(search && { title: { ilike: `%${search}%` } }),
          ...(category && {
            categories: {
              id: {
                arrayContained: [category],
              },
            },
          }),
        },
      });

      const totalCount = allResources.length;
      const totalPages = Math.ceil(totalCount / limitNum);

      // Get paginated results
      const resourcesList = await db.query.resources.findMany({
        with: {
          contentType: true,
          categories: true,
          uploader: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
          attachments: true,
        },
        where: {
          ...(contentType && { contentTypeId: contentType }),
          ...(search && { title: { ilike: `%${search}%` } }),
          ...(category && {
            categories: {
              id: {
                arrayContained: [category],
              },
            },
          }),
        },
        orderBy: { createdAt: "desc" },
        limit: limitNum,
        offset: offset,
      });

      return {
        success: true,
        data: resourcesList,
        metadata: {
          totalCount,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasMore: pageNum < totalPages,
        },
      };
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        contentType: t.Optional(t.String()),
        search: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resources"],
        summary: "List resources with filtering and pagination",
      },
    },
  )
  .get(
    "/mine",
    async ({ user }) => {
      const myResources = await db.query.resources.findMany({
        where: {
          uploaderId: user.id,
        },
        with: {
          contentType: true,
          categories: true,
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: myResources,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resources"],
        summary: "List resources uploaded by the current user",
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const resource = await db.query.resources.findFirst({
        where: { id },
        with: {
          contentType: true,
          categories: true,
          uploader: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
          attachments: true,
        },
      });

      if (!resource) {
        set.status = 404;
        return { success: false, error: "Resource not found" };
      }

      return {
        success: true,
        data: resource,
      };
    },
    {
      detail: {
        tags: ["Resources"],
        summary: "Get a single resource by ID",
      },
    },
  )
  // --- Resource Management ---
  .post(
    "/",
    async ({ user, body }) => {
      const { title, description, contentTypeId, categoryIds, attachments } =
        body;

      const resourceId = crypto.randomUUID();

      // Process attachments: upload files to S3 and collect attachment data
      const processedAttachments: Array<{
        id: string;
        resourceId: string;
        type: "file" | "url";
        url: string;
        name: string;
        fileFormat: string | null;
      }> = [];

      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.type === "file") {
            // For file uploads, we need to handle the File object
            // Note: In Elysia with t.Files(), we get an array of files
            const files = body.files as unknown as File[];
            const file = files?.[0];
            if (file) {
              const fileName = file.name;
              const fileFormat = fileName.split(".").pop() ?? "unknown";

              const { url } = await uploadToS3({
                file: new Uint8Array(await file.arrayBuffer()),
                fileName,
                contentType: file.type,
              });

              processedAttachments.push({
                id: crypto.randomUUID(),
                resourceId,
                type: "file",
                url,
                name: attachment.name,
                fileFormat,
              });
            }
          } else if (attachment.type === "url") {
            processedAttachments.push({
              id: crypto.randomUUID(),
              resourceId,
              type: "url",
              url: attachment.url,
              name: attachment.name,
              fileFormat: null,
            });
          }
        }
      }

      // Save to database in a transaction
      await db.transaction(async (trx) => {
        // For backward compatibility, set the primary file as the first attachment
        const primaryAttachment = processedAttachments[0];
        await trx.insert(resources).values({
          id: resourceId,
          title,
          description: description ?? null,
          s3Url: primaryAttachment?.url ?? "",
          contentTypeId,
          uploaderId: user.id,
        });

        // Add categories
        if (categoryIds && categoryIds.length > 0) {
          await trx.insert(resourcesToCategories).values(
            categoryIds.map((cid: string) => ({
              resourceId,
              categoryId: cid,
            })),
          );
        }

        // Add attachments
        if (processedAttachments.length > 0) {
          await trx.insert(resourceAttachments).values(processedAttachments);
        }
      });

      return {
        success: true,
        data: {
          id: resourceId,
          title,
          attachments: processedAttachments.map((a) => ({
            id: a.id,
            type: a.type,
            url: a.url,
            name: a.name,
            fileFormat: a.fileFormat,
          })),
        },
      };
    },
    {
      auth: true,
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        files: t.Files(),
        contentTypeId: t.String(),
        categoryIds: t.Optional(t.Array(t.String())),
        attachments: t.Optional(
          t.Array(t.Union([attachmentFileSchema, attachmentUrlSchema])),
        ),
      }),
      detail: {
        tags: ["Resources"],
        summary: "Upload a new resource (Authorized Only)",
      },
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      const {
        title,
        description,
        contentTypeId,
        categoryIds,
        isFeatured,
        attachments,
      } = body;

      const existing = await db.query.resources.findFirst({
        where: { id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Resource not found" };
      }

      // Authorization check: Owner or Admin
      if (existing.uploaderId !== user.id && user.role !== "admin") {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      await db.transaction(async (trx) => {
        await trx
          .update(resources)
          .set({
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(contentTypeId && { contentTypeId }),
            ...(isFeatured !== undefined && { isFeatured }),
            updatedAt: new Date(),
          })
          .where(eq(resources.id, id));

        if (categoryIds !== undefined) {
          // Update categories: delete old ones and insert new ones
          await trx
            .delete(resourcesToCategories)
            .where(eq(resourcesToCategories.resourceId, id));

          if (categoryIds.length > 0) {
            await trx.insert(resourcesToCategories).values(
              categoryIds.map((cid: string) => ({
                resourceId: id,
                categoryId: cid,
              })),
            );
          }
        }

        // Handle attachments add/update/remove
        if (attachments) {
          // Remove attachments marked for deletion
          if (attachments.remove && attachments.remove.length > 0) {
            await trx
              .delete(resourceAttachments)
              .where(
                inArray(resourceAttachments.id, attachments.remove as string[]),
              );
          }

          // Add new attachments
          if (attachments.add && attachments.add.length > 0) {
            for (const attachment of attachments.add) {
              if (attachment.type === "file") {
                // File upload handling would go here
                // For now, skip file uploads in PUT
              } else if (attachment.type === "url") {
                await trx.insert(resourceAttachments).values({
                  id: crypto.randomUUID(),
                  resourceId: id,
                  type: "url",
                  url: attachment.url,
                  name: attachment.name,
                  fileFormat: null,
                });
              }
            }
          }

          // Update existing attachments
          if (attachments.update && attachments.update.length > 0) {
            for (const attachment of attachments.update) {
              await trx
                .update(resourceAttachments)
                .set({
                  name: attachment.name,
                  updatedAt: new Date(),
                })
                .where(eq(resourceAttachments.id, attachment.id));
            }
          }
        }
      });

      return {
        success: true,
        message: "Resource updated successfully",
      };
    },
    {
      auth: true,
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        contentTypeId: t.Optional(t.String()),
        categoryIds: t.Optional(t.Array(t.String())),
        isFeatured: t.Optional(t.Boolean()),
        attachments: t.Optional(
          t.Object({
            add: t.Optional(
              t.Array(t.Union([attachmentFileSchema, attachmentUrlSchema])),
            ),
            update: t.Optional(
              t.Array(
                t.Object({
                  id: t.String(),
                  name: t.Optional(t.String()),
                  url: t.Optional(t.String()),
                }),
              ),
            ),
            remove: t.Optional(t.Array(t.String())),
          }),
        ),
      }),
      detail: {
        tags: ["Resources"],
        summary: "Update resource metadata (Owner or Admin)",
      },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      const existing = await db.query.resources.findFirst({
        where: { id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Resource not found" };
      }

      // Authorization check: Owner or Admin
      if (existing.uploaderId !== user.id && user.role !== "admin") {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      // Note: We might want to delete from S3 as well, but for safety usually we keep it or use a background job.
      // For this implementation, we just delete metadata (attachments will cascade delete due to FK constraint).

      await db.delete(resources).where(eq(resources.id, id));

      return {
        success: true,
        message: "Resource deleted successfully",
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resources"],
        summary: "Delete a resource (Owner or Admin)",
      },
    },
  )
  // --- Attachment Management ---
  .get(
    "/:id/attachments",
    async ({ params: { id } }) => {
      const attachments = await db.query.resourceAttachments.findMany({
        where: { resourceId: id },
      });

      return {
        success: true,
        data: attachments,
      };
    },
    {
      detail: {
        tags: ["Resources"],
        summary: "Get all attachments for a resource",
      },
    },
  )
  .post(
    "/:id/attachments",
    async ({ params: { id }, body, user, set }) => {
      const { type, url, name } = body;

      // Verify resource exists and user has permission
      const existing = await db.query.resources.findFirst({
        where: { id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Resource not found" };
      }

      if (existing.uploaderId !== user.id && user.role !== "admin") {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      const attachmentId = crypto.randomUUID();

      if (type === "url" && name) {
        const attachmentData = {
          id: attachmentId,
          resourceId: id,
          type: "url" as const,
          url: url ?? "",
          name: name as string,
          fileFormat: null,
        };
        await db.insert(resourceAttachments).values(attachmentData);
      } else {
        set.status = 400;
        return {
          success: false,
          error: "File uploads not supported in this endpoint",
        };
      }

      return {
        success: true,
        data: {
          id: attachmentId,
          type,
          url,
          name,
          fileFormat: null,
        },
      };
    },
    {
      auth: true,
      body: t.Object({
        type: t.Union([t.Literal("file"), t.Literal("url")]),
        url: t.Optional(t.String()),
        name: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Resources"],
        summary: "Add an attachment to a resource (URL only, Owner or Admin)",
      },
    },
  )
  .delete(
    "/:id/attachments/:attachmentId",
    async ({ params: { id, attachmentId }, user, set }) => {
      // Verify resource exists and user has permission
      const existing = await db.query.resources.findFirst({
        where: { id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Resource not found" };
      }

      if (existing.uploaderId !== user.id && user.role !== "admin") {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      await db
        .delete(resourceAttachments)
        .where(
          and(
            eq(resourceAttachments.id, attachmentId),
            eq(resourceAttachments.resourceId, id),
          ),
        );

      return {
        success: true,
        message: "Attachment deleted successfully",
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resources"],
        summary: "Delete an attachment (Owner or Admin)",
      },
    },
  );
