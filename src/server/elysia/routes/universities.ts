import { and, eq, ilike, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  countries,
  universities,
  universityToRatings,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const universityRoutes = new Elysia({ prefix: "/universities" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query }) => {
      const { search, country, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      const conditions = [];
      const dbConditions = [];

      if (search) {
        conditions.push({ name: { ilike: `%${search}%` } });
        dbConditions.push(ilike(universities.name, `%${search}%`));
      }

      if (country) {
        const countryRecords = await db
          .select()
          .from(countries)
          .where(eq(countries.code, country))
          .limit(1);

        if (countryRecords.length > 0) {
          conditions.push({ country: countryRecords[0].name });
          dbConditions.push(eq(universities.country, countryRecords[0].name));
        }
      }

      const results = await db.query.universities.findMany({
        where: conditions.length > 0 ? { AND: conditions } : undefined,
        limit: l,
        offset,
        orderBy: { createdAt: "desc" },
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(universities)
        .where(conditions.length > 0 ? and(...dbConditions) : undefined);

      const realTotal = Number(totalResult[0]?.count || 0);
      const totalPages = Math.ceil(realTotal / l);

      return {
        success: true,
        data: results,
        metadata: {
          totalCount: realTotal,
          totalPages,
          currentPage: p,
          limit: l,
          hasMore: p < totalPages,
        },
      };
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        country: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Universities"],
        summary: "List all universities",
      },
    },
  )
  .get(
    "/slug/:slug",
    async ({ params: { slug }, set }) => {
      const university = await db.query.universities.findFirst({
        where: { slug },
        with: {
          colleges: {
            with: {
              collegeDepartments: {
                with: {
                  department: true,
                },
              },
            },
          },
        },
      });

      if (!university) {
        set.status = 404;
        return { success: false, error: "University not found" };
      }

      return { success: true, data: university };
    },
    {
      detail: {
        tags: ["Universities"],
        summary: "Get university details by slug",
      },
    },
  )
  .get(
    "/:id/ratings",
    async ({ params: { id }, query }) => {
      const { categoryId } = query;

      const ratingIds = await db
        .select({ ratingId: universityToRatings.ratingId })
        .from(universityToRatings)
        .where(eq(universityToRatings.universityId, id));

      if (ratingIds.length === 0) {
        return { success: true, data: [] };
      }

      const ids = ratingIds.map((r) => r.ratingId);

      const ratingsList = await db.query.ratings.findMany({
        where: categoryId
          ? { id: { in: ids }, ratingCategoryId: categoryId }
          : { id: { in: ids } },
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
          ratingCategory: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: ratingsList };
    },
    {
      query: t.Object({
        categoryId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Universities"],
        summary: "Get ratings for a university",
      },
    },
  )
  .group("/admin", (app) =>
    app
      .use(authorizationPlugin)
      .post(
        "/",
        async ({ body, user }) => {
          const id = nanoid();
          const slug = body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          await db.insert(universities).values({
            ...body,
            id,
            slug,
            createdById: user.id,
            updatedById: user.id,
          });

          return { success: true, data: { id, slug } };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),
            websiteUrl: t.Optional(t.String()),
            logoUrl: t.Optional(t.String()),
            establishedYear: t.Optional(t.String()),
            location: t.Optional(t.String()),
            country: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body, user }) => {
          await db
            .update(universities)
            .set({ ...body, updatedById: user.id, updatedAt: new Date() })
            .where(eq(universities.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            description: t.Optional(t.String()),
            websiteUrl: t.Optional(t.String()),
            logoUrl: t.Optional(t.String()),
            establishedYear: t.Optional(t.String()),
            location: t.Optional(t.String()),
            country: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      ),
  );
