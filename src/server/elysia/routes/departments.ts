import { eq, ilike, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import { collegeDepartments, departments } from "@/server/db/schema";
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

        results = await db.query.departments.findMany({
          where:
            Object.keys(whereConditions).length > 0
              ? whereConditions
              : undefined,
          limit: l,
          offset,
          orderBy: { name: "asc" },
        });

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
        id: cd.college?.id,
        name: cd.college?.name,
        slug: cd.college?.slug,
        description: cd.college?.description,
        websiteUrl: cd.college?.websiteUrl,
        university: cd.college?.university,
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
          const baseSlug = body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          let slug = baseSlug;

          const existingDepartment = await db.query.departments.findFirst({
            where: { slug },
            columns: { id: true },
          });
          if (existingDepartment) {
            slug = `${baseSlug}-${nanoid(4)}`;
          }

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
          const updated = await db
            .update(departments)
            .set({ ...body, updatedById: user.id, updatedAt: new Date() })
            .where(eq(departments.id, id))
            .returning({ id: departments.id });
          if (updated.length === 0) {
            console.warn(
              `[departments.admin.patch] No department row updated for id=${id}`,
            );
          }
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
