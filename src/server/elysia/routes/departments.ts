import { eq, ilike, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  collegeDepartmentProgramCourseToRatings,
  collegeDepartmentProgramsToRatings,
  collegeDepartments,
  collegeDepartmentsToRatings,
  collegeToRatings,
  departments,
  ratingCategories,
  ratings,
  universityToRatings,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const departmentRoutes = new Elysia({ prefix: "/departments" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query }) => {
      const { search, collegeId, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      let results: any[] = [];
      let realTotal = 0;

      if (collegeId) {
        const collegeDeptResults = await db
          .select({
            id: collegeDepartments.id,
            name: departments.name,
            slug: departments.slug,
            description: departments.description,
            websiteUrl: departments.websiteUrl,
            isActive: departments.isActive,
            createdAt: departments.createdAt,
            updatedAt: departments.updatedAt,
          })
          .from(collegeDepartments)
          .innerJoin(
            departments,
            eq(collegeDepartments.departmentId, departments.id),
          )
          .where(
            search
              ? sql`${eq(collegeDepartments.collegeId, collegeId)} AND ${ilike(departments.name, `%${search}%`)}`
              : eq(collegeDepartments.collegeId, collegeId),
          )
          .limit(l)
          .offset(offset)
          .orderBy(departments.name);

        results = collegeDeptResults;

        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(collegeDepartments)
          .innerJoin(
            departments,
            eq(collegeDepartments.departmentId, departments.id),
          )
          .where(
            search
              ? sql`${eq(collegeDepartments.collegeId, collegeId)} AND ${ilike(departments.name, `%${search}%`)}`
              : eq(collegeDepartments.collegeId, collegeId),
          );
        realTotal = Number(totalResult[0]?.count || 0);
      } else {
        const whereConditions: any = search
          ? { name: { ilike: `%${search}%` } }
          : {};

        results = (await db.query.departments.findMany({
          where:
            Object.keys(whereConditions).length > 0
              ? whereConditions
              : undefined,
          limit: l,
          offset,
          orderBy: { name: "asc" },
        })) as any[];

        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(departments)
          .where(search ? ilike(departments.name, `%${search}%`) : undefined);
        realTotal = Number(totalResult[0]?.count || 0);
      }

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
        collegeId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Departments"],
        summary: "List all departments",
      },
    },
  )
  .get(
    "/slug/:slug",
    async ({ params: { slug }, set }) => {
      const department = await db.query.departments.findFirst({
        where: { slug },
        with: {
          colleges: true,
        },
      });

      if (!department) {
        set.status = 404;
        return { success: false, error: "Department not found" };
      }

      return { success: true, data: department };
    },
    {
      detail: {
        tags: ["Departments"],
        summary: "Get department details by slug",
      },
    },
  )
  .get(
    "/:id/ratings",
    async ({ params: { id }, query }) => {
      const { categoryId } = query;

      const ratingIds = await db
        .select({ ratingId: collegeDepartmentsToRatings.ratingId })
        .from(collegeDepartmentsToRatings)
        .where(eq(collegeDepartmentsToRatings.collegeDepartmentId, id));

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
        tags: ["Departments"],
        summary: "Get ratings for a department",
      },
    },
  )
  .get(
    "/:id/colleges",
    async ({ params: { id } }) => {
      const collegeDepartmentsList = await db.query.collegeDepartments.findMany(
        {
          where: { departmentId: id },
          with: {
            college: {
              with: {
                university: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      );

      const collegesList = collegeDepartmentsList.map((cd) => ({
        ...cd.college,
      }));

      return { success: true, data: collegesList };
    },
    {
      detail: {
        tags: ["Departments"],
        summary: "Get colleges for a department",
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

          await db.insert(departments).values({
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
            isActive: t.Optional(t.Boolean()),
          }),
          detail: {
            tags: ["Departments Admin"],
            summary: "Create department",
          },
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body, user }) => {
          await db
            .update(departments)
            .set({ ...body, updatedById: user.id, updatedAt: new Date() })
            .where(eq(departments.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            description: t.Optional(t.String()),
            websiteUrl: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
          detail: {
            tags: ["Departments Admin"],
            summary: "Update department",
          },
        },
      ),
  );

export const ratingRoutes = new Elysia({ prefix: "/ratings" })
  .use(authorizationPlugin)
  .get(
    "/categories",
    async ({ query: _ }) => {
      const categories = await db.query.ratingCategories.findMany({
        where: {},
        orderBy: { name: "asc" },
      });

      return { success: true, data: categories };
    },
    {
      query: t.Object({
        entityType: t.Optional(
          t.Enum({
            university: "university",
            college: "college",
            department: "department",
            program: "program",
            course: "course",
          }),
        ),
      }),
      detail: {
        tags: ["Ratings"],
        summary: "Get rating categories",
      },
    },
  )
  .post(
    "/",
    async ({ body, user }) => {
      const id = nanoid();
      const { entityType, entityId, categoryId, rating, review } = body;

      await db.transaction(async (tx) => {
        await tx.insert(ratings).values({
          id,
          userId: user.id,
          rating,
          review,
          ratingCategoryId: categoryId,
          isVerified: false,
        });

        switch (entityType) {
          case "university":
            await tx.insert(universityToRatings).values({
              universityId: entityId,
              ratingId: id,
            });
            break;
          case "college":
            await tx.insert(collegeToRatings).values({
              collegeId: entityId,
              ratingId: id,
            });
            break;
          case "department":
            await tx.insert(collegeDepartmentsToRatings).values({
              collegeDepartmentId: entityId,
              ratingId: id,
            });
            break;
          case "program":
            await tx.insert(collegeDepartmentProgramsToRatings).values({
              collegeDepartmentProgramId: entityId,
              ratingId: id,
            });
            break;
          case "course":
            await tx.insert(collegeDepartmentProgramCourseToRatings).values({
              collegeDepartmentProgramToCourseId: entityId,
              ratingId: id,
            });
            break;
          default:
            throw new Error(`Invalid entity type: ${entityType}`);
        }
      });

      return { success: true, data: { id } };
    },
    {
      auth: true,
      body: t.Object({
        entityType: t.Enum({
          university: "university",
          college: "college",
          department: "department",
          program: "program",
          course: "course",
        }),
        entityId: t.String(),
        categoryId: t.String(),
        rating: t.String(),
        review: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Ratings"],
        summary: "Create a rating",
      },
    },
  )
  .group("/admin", (app) =>
    app
      .use(authorizationPlugin)
      .post(
        "/categories",
        async ({ body, user }) => {
          const id = nanoid();
          const slug = body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          await db.insert(ratingCategories).values({
            ...body,
            id,
            slug,
            createdById: user.id,
            updatedById: user.id,
          });
          return { success: true, data: { id } };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),

            sortOrder: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .patch(
        "/categories/:id",
        async ({ params: { id }, body, user }) => {
          await db
            .update(ratingCategories)
            .set({ ...body, updatedById: user.id, updatedAt: new Date() })
            .where(eq(ratingCategories.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            description: t.Optional(t.String()),

            sortOrder: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      ),
  );
