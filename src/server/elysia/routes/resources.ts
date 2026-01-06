import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { uploadToS3 } from "@/lib/s3";
import { db } from "@/server/db";
import {
  resourceCategories,
  resourceContentTypes,
  resources,
  resourcesToCategories,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

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
          categories: {
            with: {
              category: true,
            },
          },
          uploader: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        where: (res, { and, eq, ilike, exists }) => {
          const conditions = [];

          if (contentType) {
            conditions.push(eq(res.contentTypeId, contentType));
          }

          if (search) {
            conditions.push(ilike(res.title, `%${search}%`));
          }

          if (category) {
            conditions.push(
              exists(
                db
                  .select()
                  .from(resourcesToCategories)
                  .where(
                    and(
                      eq(resourcesToCategories.resourceId, res.id),
                      eq(resourcesToCategories.categoryId, category),
                    ),
                  ),
              ),
            );
          }

          return and(...conditions);
        },
      });

      const totalCount = allResources.length;
      const totalPages = Math.ceil(totalCount / limitNum);

      // Get paginated results
      const resourcesList = await db.query.resources.findMany({
        with: {
          contentType: true,
          categories: {
            with: {
              category: true,
            },
          },
          uploader: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        where: (res, { and, eq, ilike, exists }) => {
          const conditions = [];

          if (contentType) {
            conditions.push(eq(res.contentTypeId, contentType));
          }

          if (search) {
            conditions.push(ilike(res.title, `%${search}%`));
          }

          if (category) {
            conditions.push(
              exists(
                db
                  .select()
                  .from(resourcesToCategories)
                  .where(
                    and(
                      eq(resourcesToCategories.resourceId, res.id),
                      eq(resourcesToCategories.categoryId, category),
                    ),
                  ),
              ),
            );
          }

          return and(...conditions);
        },
        orderBy: (res, { desc }) => [desc(res.createdAt)],
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
        where: eq(resources.uploaderId, user.id),
        with: {
          contentType: true,
          categories: {
            with: {
              category: true,
            },
          },
        },
        orderBy: (resources, { desc }) => [desc(resources.createdAt)],
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
  // --- Resource Management ---
  .post(
    "/",
    async ({ user, body }) => {
      const { title, description, file, contentTypeId, categoryIds } = body;

      const fileName = file.name;
      const fileFormat = fileName.split(".").pop() ?? "unknown";

      // 1. Upload to S3
      const { url } = await uploadToS3({
        file: new Uint8Array(await file.arrayBuffer()),
        fileName,
        contentType: file.type,
      });

      const resourceId = crypto.randomUUID();

      // 2. Save to database in a transaction
      await db.transaction(async (trx) => {
        await trx.insert(resources).values({
          id: resourceId,
          title,
          description: description ?? null,
          s3Url: url,
          fileFormat,
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
      });

      return {
        success: true,
        data: { id: resourceId, title, url },
      };
    },
    {
      auth: true,
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        file: t.File(),
        contentTypeId: t.String(),
        categoryIds: t.Optional(t.Array(t.String())),
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
      const { title, description, contentTypeId, categoryIds, isFeatured } =
        body;

      const existing = await db.query.resources.findFirst({
        where: eq(resources.id, id),
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
        where: eq(resources.id, id),
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
      // For this implementation, we just delete metadata.

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
  );
