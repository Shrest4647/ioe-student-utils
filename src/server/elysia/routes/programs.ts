import { and, eq, ilike, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  academicCourses,
  academicPrograms,
  collegeDepartmentProgramCourseToRatings,
  collegeDepartmentProgramsToRatings,
  collegeDepartmentProgramToCourses,
  collegeDepartmentsToPrograms,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const programRoutes = new Elysia({ prefix: "/programs" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query }) => {
      const { search, degreeLevel, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      const whereCondition: Record<string, unknown> = {};
      if (search) {
        whereCondition.name = { ilike: `%${search}%` };
      }
      if (degreeLevel) {
        whereCondition.degreeLevels = degreeLevel;
      }

      const results = await db.query.academicPrograms.findMany({
        where: { ...whereCondition },
        limit: l,
        offset,
        orderBy: { createdAt: "desc" },
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(academicPrograms)
        .where(
          Object.keys(whereCondition).length > 0
            ? and(
                search
                  ? ilike(academicPrograms.name, `%${search}%`)
                  : sql`TRUE`,
                degreeLevel
                  ? eq(academicPrograms.degreeLevels, degreeLevel)
                  : sql`TRUE`,
              )
            : undefined,
        );

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
        degreeLevel: t.Optional(
          t.Enum({
            certificate: "certificate",
            diploma: "diploma",
            associate: "associate",
            undergraduate: "undergraduate",
            postgraduate: "postgraduate",
            doctoral: "doctoral",
            postdoctoral: "postdoctoral",
          }),
        ),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Programs"],
        summary: "List all academic programs",
      },
    },
  )
  .get(
    "/:code",
    async ({ params: { code }, set }) => {
      const program = await db.query.academicPrograms.findFirst({
        where: { code },
        with: {
          collegeDepartments: {
            with: {
              college: {
                with: {
                  university: true,
                },
              },
              department: true,
            },
          },
        },
      });

      if (!program) {
        set.status = 404;
        return { success: false, error: "Program not found" };
      }

      return { success: true, data: program };
    },
    {
      detail: {
        tags: ["Programs"],
        summary: "Get program details by code",
      },
    },
  )
  .get(
    "/:id/ratings",
    async ({ params: { id }, query }) => {
      const { categoryId } = query;

      const ratingIds = await db
        .select({ ratingId: collegeDepartmentProgramsToRatings.ratingId })
        .from(collegeDepartmentProgramsToRatings)
        .where(
          eq(collegeDepartmentProgramsToRatings.collegeDepartmentProgramId, id),
        );

      if (ratingIds.length === 0) {
        return { success: true, data: [] };
      }

      const ids = ratingIds.map((r) => r.ratingId);

      const whereCondition: Record<string, unknown> = { id: { in: ids } };
      if (categoryId) {
        whereCondition.ratingCategoryId = categoryId;
      }

      const ratingsList = await db.query.ratings.findMany({
        where: whereCondition,
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
        tags: ["Programs"],
        summary: "Get ratings for a program",
      },
    },
  )
  .get(
    "/:id/courses",
    async ({ params: { id } }) => {
      const programCourses = await db
        .select({ courseId: collegeDepartmentProgramToCourses.courseId })
        .from(collegeDepartmentProgramToCourses)
        .where(eq(collegeDepartmentProgramToCourses.programId, id));

      if (programCourses.length === 0) {
        return { success: true, data: [] };
      }

      const courseIds = programCourses.map((pc) => pc.courseId);
      const courses = await db.query.academicCourses.findMany({
        where: { id: { in: courseIds } },
      });

      return { success: true, data: courses };
    },
    {
      detail: {
        tags: ["Programs"],
        summary: "Get courses for a program",
      },
    },
  )
  .group("/admin", (app) =>
    app
      .use(authorizationPlugin)
      .post(
        "/",
        async ({ body }) => {
          const id = nanoid();
          const code =
            body.code || body.name.toUpperCase().replace(/[^A-Z0-9]+/g, "");

          await db.insert(academicPrograms).values({
            ...body,
            id,
            code,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, data: { id, code } };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String(),
            code: t.Optional(t.String()),
            description: t.Optional(t.String()),
            credits: t.Optional(t.String()),
            degreeLevels: t.Optional(
              t.Enum({
                certificate: "certificate",
                diploma: "diploma",
                associate: "associate",
                undergraduate: "undergraduate",
                postgraduate: "postgraduate",
                doctoral: "doctoral",
                postdoctoral: "postdoctoral",
              }),
            ),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body }) => {
          await db
            .update(academicPrograms)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(academicPrograms.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            code: t.Optional(t.String()),
            description: t.Optional(t.String()),
            credits: t.Optional(t.String()),
            degreeLevels: t.Optional(
              t.Enum({
                certificate: "certificate",
                diploma: "diploma",
                associate: "associate",
                undergraduate: "undergraduate",
                postgraduate: "postgraduate",
                doctoral: "doctoral",
                postdoctoral: "postdoctoral",
              }),
            ),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .post(
        "/:collegeDepartmentId/programs/:programId",
        async ({ params: { collegeDepartmentId, programId } }) => {
          const id = nanoid();
          await db.insert(collegeDepartmentsToPrograms).values({
            id,
            collegeDepartmentId,
            programId,
          });
          return { success: true, data: { id } };
        },
        {
          role: "admin",
        },
      )
      .delete(
        "/:id",
        async ({ params: { id } }) => {
          await db
            .delete(collegeDepartmentsToPrograms)
            .where(eq(collegeDepartmentsToPrograms.id, id));
          return { success: true };
        },
        {
          role: "admin",
        },
      ),
  );

export const courseRoutes = new Elysia({ prefix: "/courses" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query }) => {
      const { search, programId, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      const whereCondition: Record<string, unknown> = {};
      if (search) {
        whereCondition.name = { ilike: `%${search}%` };
      }
      if (programId) {
        const programCourseIds = await db
          .select({ courseId: collegeDepartmentProgramToCourses.courseId })
          .from(collegeDepartmentProgramToCourses)
          .where(eq(collegeDepartmentProgramToCourses.programId, programId));
        const ids = programCourseIds.map((pc) => pc.courseId);
        (whereCondition as { id: unknown }).id = { in: ids };
      }

      const results = await db.query.academicCourses.findMany({
        where:
          Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
        limit: l,
        offset,
        orderBy: { createdAt: "desc" },
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(academicCourses)
        .where(
          Object.keys(whereCondition).length > 0
            ? (whereCondition as { id: unknown })
              ? eq(
                  academicCourses.id,
                  (whereCondition.id as { in: string[] }).in[0] as string,
                )
              : ilike(
                  academicCourses.name,
                  (whereCondition.name as { ilike: string }).ilike,
                )
            : undefined,
        );

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
        programId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Courses"],
        summary: "List all academic courses",
      },
    },
  )
  .get(
    "/:code",
    async ({ params: { code }, set }) => {
      const course = await db.query.academicCourses.findFirst({
        where: { code },
        with: {
          academicPrograms: {
            with: {
              collegeDepartments: {
                with: {
                  college: {
                    with: {
                      university: true,
                    },
                  },
                  department: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        set.status = 404;
        return { success: false, error: "Course not found" };
      }

      return { success: true, data: course };
    },
    {
      detail: {
        tags: ["Courses"],
        summary: "Get course details by code",
      },
    },
  )
  .get(
    "/:id/ratings",
    async ({ params: { id }, query }) => {
      const { categoryId } = query;

      const ratingIds = await db
        .select({ ratingId: collegeDepartmentProgramCourseToRatings.ratingId })
        .from(collegeDepartmentProgramCourseToRatings)
        .where(
          eq(
            collegeDepartmentProgramCourseToRatings.collegeDepartmentProgramToCourseId,
            id,
          ),
        );

      if (ratingIds.length === 0) {
        return { success: true, data: [] };
      }

      const ids = ratingIds.map((r) => r.ratingId);

      const whereCondition: Record<string, unknown> = { id: { in: ids } };
      if (categoryId) {
        whereCondition.ratingCategoryId = categoryId;
      }

      const ratingsList = await db.query.ratings.findMany({
        where: whereCondition,
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
        tags: ["Courses"],
        summary: "Get ratings for a course",
      },
    },
  )
  .get(
    "/:id/programs",
    async ({ params: { id } }) => {
      const coursePrograms = await db
        .select({ programId: collegeDepartmentProgramToCourses.programId })
        .from(collegeDepartmentProgramToCourses)
        .where(eq(collegeDepartmentProgramToCourses.courseId, id));

      if (coursePrograms.length === 0) {
        return { success: true, data: [] };
      }

      const programIds = coursePrograms.map((cp) => cp.programId);
      const programs = await db.query.academicPrograms.findMany({
        where: { id: { in: programIds } },
        with: {
          collegeDepartments: {
            with: {
              college: {
                with: {
                  university: true,
                },
              },
              department: true,
            },
          },
        },
      });

      return { success: true, data: programs };
    },
    {
      detail: {
        tags: ["Courses"],
        summary: "Get programs for a course",
      },
    },
  )
  .group("/admin", (app) =>
    app
      .use(authorizationPlugin)
      .post(
        "/",
        async ({ body }) => {
          const id = nanoid();
          const code =
            body.code || body.name.toUpperCase().replace(/[^A-Z0-9]+/g, "");

          await db.insert(academicCourses).values({
            ...body,
            id,
            code,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, data: { id, code } };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String(),
            code: t.Optional(t.String()),
            description: t.Optional(t.String()),
            credits: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body }) => {
          await db
            .update(academicCourses)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(academicCourses.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            code: t.Optional(t.String()),
            description: t.Optional(t.String()),
            credits: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .post(
        "/:programId/courses/:courseId",
        async ({ params: { programId, courseId } }) => {
          const id = nanoid();
          await db.insert(collegeDepartmentProgramToCourses).values({
            id,
            programId,
            courseId,
          });
          return { success: true, data: { id } };
        },
        {
          role: "admin",
        },
      )
      .delete(
        "/:id",
        async ({ params: { id } }) => {
          await db
            .delete(collegeDepartmentProgramToCourses)
            .where(eq(collegeDepartmentProgramToCourses.id, id));
          return { success: true };
        },
        {
          role: "admin",
        },
      ),
  );
