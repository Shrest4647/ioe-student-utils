import { and, eq, ilike, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  collegeDepartmentProgramCourseToRatings,
  collegeDepartmentProgramsToRatings,
  collegeDepartments,
  collegeDepartmentsToRatings,
  colleges,
  collegeToRatings,
  countries,
  departments,
  ratingCategories,
  ratings,
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

export const collegeRoutes = new Elysia({ prefix: "/colleges" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query }) => {
      const { search, universityId, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      const conditions = [];
      const dbConditions = [];
      if (search) {
        conditions.push({ name: { ilike: `%${search}%` } });
        dbConditions.push(ilike(colleges.name, `%${search}%`));
      }
      if (universityId) {
        conditions.push({ universityId });
        dbConditions.push(eq(colleges.universityId, universityId));
      }

      const results = await db.query.colleges.findMany({
        where: {
          AND: [...conditions],
        },
        with: { university: true },
        limit: l,
        offset,
        orderBy: { createdAt: "desc" },
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(colleges)
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
        universityId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Colleges"],
        summary: "List all colleges",
      },
    },
  )
  .get(
    "/slug/:slug",
    async ({ params: { slug }, set }) => {
      const college = await db.query.colleges.findFirst({
        where: { slug },
        with: {
          university: true,
        },
      });

      if (!college) {
        set.status = 404;
        return { success: false, error: "College not found" };
      }

      return { success: true, data: college };
    },
    {
      detail: {
        tags: ["Colleges"],
        summary: "Get college details by slug",
      },
    },
  )
  .get(
    "/:id/ratings",
    async ({ params: { id }, query }) => {
      const { categoryId } = query;

      const ratingIds = await db
        .select({ ratingId: collegeToRatings.ratingId })
        .from(collegeToRatings)
        .where(eq(collegeToRatings.collegeId, id));

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
        tags: ["Colleges"],
        summary: "Get ratings for a college",
      },
    },
  )
  .get(
    "/:id/departments",
    async ({ params: { id } }) => {
      const collegeDepartmentsList = await db.query.collegeDepartments.findMany(
        {
          where: { collegeId: id },
          with: {
            department: true,
          },
          orderBy: { createdAt: "asc" },
        },
      );

      const departmentsList = collegeDepartmentsList.map((cd) => ({
        ...cd.department,
        collegeId: cd.collegeId,
      }));

      return { success: true, data: departmentsList };
    },
    {
      detail: {
        tags: ["Colleges"],
        summary: "Get departments for a college",
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

          await db.insert(colleges).values({
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
            universityId: t.String(),
            name: t.String(),
            description: t.Optional(t.String()),
            websiteUrl: t.Optional(t.String()),
            location: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body, user }) => {
          await db
            .update(colleges)
            .set({ ...body, updatedById: user.id, updatedAt: new Date() })
            .where(eq(colleges.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            description: t.Optional(t.String()),
            websiteUrl: t.Optional(t.String()),
            location: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .post(
        "/:id/departments/:departmentId",
        async ({ params: { id: collegeId, departmentId } }) => {
          const id = nanoid();
          await db.insert(collegeDepartments).values({
            id,
            collegeId,
            departmentId,
          });
          return { success: true, data: { id } };
        },
        {
          role: "admin",
        },
      ),
  );

export const departmentRoutes = new Elysia({ prefix: "/departments" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query }) => {
      const { search, collegeId, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      const whereConditions: Record<string, unknown> = search
        ? { name: { ilike: `%${search}%` } }
        : {};

      let departmentIdsToFilter: string[] | undefined;

      if (collegeId) {
        const collegeDeptIds = await db
          .select({ departmentId: collegeDepartments.departmentId })
          .from(collegeDepartments)
          .where(eq(collegeDepartments.collegeId, collegeId));

        departmentIdsToFilter = collegeDeptIds.map((cd) => cd.departmentId);

        if (departmentIdsToFilter.length === 0) {
          return {
            success: true,
            data: [],
            metadata: {
              totalCount: 0,
              totalPages: 0,
              currentPage: p,
              limit: l,
              hasMore: false,
            },
          };
        }
      }

      if (departmentIdsToFilter) {
        (whereConditions as { id: unknown }).id = { in: departmentIdsToFilter };
      }

      const results = await db.query.departments.findMany({
        where:
          Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
        limit: l,
        offset,
        orderBy: { createdAt: "desc" },
      });

      const dbWhereCondition = departmentIdsToFilter
        ? eq(departments.id, departmentIdsToFilter[0])
        : ilike(departments.name, `%${search || ""}%`);

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(departments)
        .where(dbWhereCondition);

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
        },
      ),
  );

export const ratingRoutes = new Elysia({ prefix: "/ratings" })
  .use(authorizationPlugin)
  .get(
    "/categories",
    async ({ query }) => {
      const { entityType } = query;

      const categories = await db.query.ratingCategories.findMany({
        where: entityType
          ? {
              applicableEntityType: {
                in: [entityType, "all"],
              },
            }
          : undefined,
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
            applicableEntityType: t.Optional(
              t.Enum({
                university: "university",
                college: "college",
                department: "department",
                program: "program",
                course: "course",
                all: "all",
              }),
            ),
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
            applicableEntityType: t.Optional(
              t.Enum({
                university: "university",
                college: "college",
                department: "department",
                program: "program",
                course: "course",
                all: "all",
              }),
            ),
            sortOrder: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      ),
  );
