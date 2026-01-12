import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  collegeDepartmentProgramToCourses,
  collegeDepartments,
  collegeDepartmentsToPrograms,
  colleges,
  collegeToRatings,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

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

      return { success: true, data: collegeDepartmentsList };
    },
    {
      detail: {
        tags: ["Colleges"],
        summary: "Get departments for a college",
      },
    },
  )
  .get(
    "/:id/departments/:departmentId",
    async ({ params: { id: collegeId, departmentId }, set }) => {
      const collegeDepartment = await db.query.collegeDepartments.findFirst({
        where: {
          AND: [
            {
              collegeId: collegeId,
            },
            {
              departmentId: departmentId,
            },
          ],
        },
        with: {
          department: true,
        },
      });

      if (!collegeDepartment) {
        set.status = 404;
        return { success: false, error: "College department not found" };
      }

      return { success: true, data: collegeDepartment };
    },
    {
      detail: {
        tags: ["Colleges"],
        summary: "Get college department details",
      },
    },
  )
  .get(
    "/:id/departments/:departmentId/programs",
    async ({ params: { id: collegeId, departmentId }, set }) => {
      const collegeDepartment = await db.query.collegeDepartments.findFirst({
        where: {
          AND: [
            {
              collegeId: collegeId,
            },
            {
              departmentId: departmentId,
            },
          ],
        },
      });

      if (!collegeDepartment) {
        set.status = 404;
        return { success: false, error: "College department not found" };
      }

      const collegePrograms =
        await db.query.collegeDepartmentsToPrograms.findMany({
          where: {
            collegeDepartmentId: collegeDepartment.id,
          },
          with: {
            program: true,
          },
        });

      return { success: true, data: collegePrograms };
    },
    {
      detail: {
        tags: ["Colleges"],
        summary: "Get programs for a college department",
      },
    },
  )
  .get(
    "/:id/departments/:departmentId/programs/:programId",
    async ({ params: { id: collegeId, departmentId, programId }, set }) => {
      const collegeDepartment = await db.query.collegeDepartments.findFirst({
        where: {
          AND: [
            {
              collegeId: collegeId,
            },
            {
              departmentId: departmentId,
            },
          ],
        },
      });

      if (!collegeDepartment) {
        set.status = 404;
        return { success: false, error: "College department not found" };
      }

      const collegeProgram =
        await db.query.collegeDepartmentsToPrograms.findFirst({
          where: {
            AND: [
              {
                collegeDepartmentId: collegeDepartment.id,
              },
              {
                programId: programId,
              },
            ],
          },

          with: {
            program: true,
          },
        });

      if (!collegeProgram) {
        set.status = 404;
        return { success: false, error: "College program not found" };
      }

      return { success: true, data: collegeProgram };
    },
    {
      detail: {
        tags: ["Colleges"],
        summary: "Get college program details",
      },
    },
  )
  .get(
    "/:id/departments/:departmentId/programs/:programId/courses",
    async ({ params: { id: collegeId, departmentId, programId }, set }) => {
      const collegeDepartment = await db.query.collegeDepartments.findFirst({
        where: {
          AND: [
            {
              collegeId: collegeId,
            },
            {
              departmentId: departmentId,
            },
          ],
        },
      });

      if (!collegeDepartment) {
        set.status = 404;
        return { success: false, error: "College department not found" };
      }

      const collegeProgram =
        await db.query.collegeDepartmentsToPrograms.findFirst({
          where: {
            AND: [
              {
                collegeDepartmentId: collegeDepartment.id,
              },
              {
                programId: programId,
              },
            ],
          },
        });

      if (!collegeProgram) {
        set.status = 404;
        return { success: false, error: "College program not found" };
      }

      const collegeCourses =
        await db.query.collegeDepartmentProgramToCourses.findMany({
          where: {
            programId: collegeProgram.id,
          },
          with: {
            course: true,
          },
        });

      return { success: true, data: collegeCourses };
    },
    {
      detail: {
        tags: ["Colleges"],
        summary: "Get college program courses",
      },
    },
  )
  .get(
    "/:id/departments/:departmentId/programs/:programId/courses/:courseId",
    async ({
      params: { id: collegeId, departmentId, programId, courseId },
      set,
    }) => {
      const collegeDepartment = await db.query.collegeDepartments.findFirst({
        where: {
          AND: [
            {
              collegeId: collegeId,
            },
            {
              departmentId: departmentId,
            },
          ],
        },
      });

      if (!collegeDepartment) {
        set.status = 404;
        return { success: false, error: "College department not found" };
      }

      const collegeProgram =
        await db.query.collegeDepartmentsToPrograms.findFirst({
          where: {
            AND: [
              {
                collegeDepartmentId: collegeDepartment.id,
              },
              {
                programId: programId,
              },
            ],
          },
        });

      if (!collegeProgram) {
        set.status = 404;
        return { success: false, error: "College program not found" };
      }

      const collegeCourse =
        await db.query.collegeDepartmentProgramToCourses.findFirst({
          where: {
            AND: [
              {
                courseId: courseId,
              },
              {
                programId: collegeProgram.id,
              },
            ],
          },
          with: {
            course: true,
          },
        });

      if (!collegeCourse) {
        set.status = 404;
        return { success: false, error: "College course not found" };
      }

      return { success: true, data: collegeCourse };
    },
    {
      detail: {
        tags: ["Colleges"],
        summary: "Get college course details",
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
        "/:id/departments",
        async ({ params: { id: collegeId }, body: { departmentIds } }) => {
          const currentDepartmentIds = await db
            .select({ departmentId: collegeDepartments.departmentId })
            .from(collegeDepartments)
            .where(eq(collegeDepartments.collegeId, collegeId));
          const currentDepartmentIdsSet = new Set(
            currentDepartmentIds.map((d) => d.departmentId),
          );
          const inputDepartmentIdsSet = new Set(departmentIds);

          const newDepartmentIds = inputDepartmentIdsSet.difference(
            currentDepartmentIdsSet,
          );

          const removedDepartmentIds = currentDepartmentIdsSet.difference(
            inputDepartmentIdsSet,
          );
          if (removedDepartmentIds.size > 0) {
            await db
              .update(collegeDepartments)
              .set({ isActive: false })
              .where(
                and(
                  eq(collegeDepartments.collegeId, collegeId),
                  inArray(
                    collegeDepartments.departmentId,
                    Array.from(removedDepartmentIds),
                  ),
                ),
              );
          }
          if (newDepartmentIds.size > 0) {
            await db.insert(collegeDepartments).values(
              Array.from(newDepartmentIds).map((departmentId) => ({
                id: nanoid(),
                collegeId,
                departmentId,
              })),
            );
          }

          return {
            success: true,
            data: {
              added: newDepartmentIds.size,
              removed: removedDepartmentIds.size,
            },
          };
        },
        {
          role: "admin",
          body: t.Object({
            departmentIds: t.Array(t.String()),
          }),
        },
      )
      .patch(
        "/:id/departments/:departmentId",
        async ({ params: { id: collegeId, departmentId }, body }) => {
          await db
            .update(collegeDepartments)
            .set(body)
            .where(
              and(
                eq(collegeDepartments.collegeId, collegeId),
                eq(collegeDepartments.departmentId, departmentId),
              ),
            );
          return { success: true, data: { id: collegeId, departmentId } };
        },
        {
          role: "admin",
          body: t.Object({
            description: t.Optional(t.String()),
            websiteUrl: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .delete(
        "/:id/departments/:departmentId",
        async ({ params: { id: collegeId, departmentId } }) => {
          await db
            .delete(collegeDepartments)
            .where(
              and(
                eq(collegeDepartments.collegeId, collegeId),
                eq(collegeDepartments.departmentId, departmentId),
              ),
            );
          return { success: true, data: { id: collegeId, departmentId } };
        },
        {
          role: "admin",
        },
      )
      .post(
        "/:id/departments/:departmentId/programs",
        async ({
          params: { id: collegeId, departmentId },
          body: { programIds },
        }) => {
          const collegeDepartmentIds = await db
            .select({ collegeDepartmentId: collegeDepartments.id })
            .from(collegeDepartments)
            .where(
              and(
                eq(collegeDepartments.collegeId, collegeId),
                eq(collegeDepartments.departmentId, departmentId),
              ),
            )
            .limit(1);

          const collegeDepartmentId =
            collegeDepartmentIds?.[0].collegeDepartmentId;
          if (!collegeDepartmentId) {
            return { success: false, error: "College department not found" };
          }

          const currentProgramIds = await db
            .select({ programId: collegeDepartmentsToPrograms.programId })
            .from(collegeDepartmentsToPrograms)
            .where(
              eq(
                collegeDepartmentsToPrograms.collegeDepartmentId,
                collegeDepartmentId,
              ),
            );
          const currentProgramIdsSet = new Set(
            currentProgramIds.map((p) => p.programId),
          );
          const inputProgramIdsSet = new Set(programIds);

          const newProgramids =
            inputProgramIdsSet.difference(currentProgramIdsSet);
          const removedProgramIds =
            currentProgramIdsSet.difference(inputProgramIdsSet);

          if (newProgramids.size > 0) {
            await db.insert(collegeDepartmentsToPrograms).values(
              Array.from(newProgramids).map((programId) => ({
                id: nanoid(),
                collegeDepartmentId,
                programId,
              })),
            );
          }

          if (removedProgramIds.size > 0) {
            await db
              .delete(collegeDepartmentsToPrograms)
              .where(
                and(
                  eq(
                    collegeDepartmentsToPrograms.collegeDepartmentId,
                    collegeDepartmentId,
                  ),
                  inArray(
                    collegeDepartmentsToPrograms.programId,
                    Array.from(removedProgramIds),
                  ),
                ),
              );
          }

          return {
            success: true,
            data: {
              added: newProgramids.size,
              removed: removedProgramIds.size,
            },
          };
        },
        {
          role: "admin",
          body: t.Object({
            programIds: t.Array(t.String()),
          }),
        },
      )
      .patch(
        "/:id/departments/:departmentId/programs/:programId",
        async ({ params: { id, departmentId, programId }, body }) => {
          const collegeDepartmentIds = await db
            .select({ id: collegeDepartments.id })
            .from(collegeDepartments)
            .where(
              and(
                eq(collegeDepartments.collegeId, id),
                eq(collegeDepartments.departmentId, departmentId),
              ),
            )
            .limit(1);

          const collegeDepartmentId = collegeDepartmentIds?.[0]?.id;

          if (!collegeDepartmentId) {
            return { success: false, error: "College department not found" };
          }

          await db
            .update(collegeDepartmentsToPrograms)
            .set({ ...body })
            .where(
              and(
                eq(
                  collegeDepartmentsToPrograms.collegeDepartmentId,
                  collegeDepartmentId,
                ),
                eq(collegeDepartmentsToPrograms.programId, programId),
              ),
            );
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            code: t.Optional(t.String()),
            description: t.Optional(t.String()),
            credits: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .delete(
        "/:id/departments/:departmentId/programs/:programId",
        async ({ params: { id, departmentId, programId } }) => {
          const collegeDepartmentIds = await db
            .select({ id: collegeDepartments.id })
            .from(collegeDepartments)
            .where(
              and(
                eq(collegeDepartments.collegeId, id),
                eq(collegeDepartments.departmentId, departmentId),
              ),
            )
            .limit(1);

          const collegeDepartmentId = collegeDepartmentIds?.[0]?.id;

          if (!collegeDepartmentId) {
            return { success: false, error: "College department not found" };
          }

          await db
            .delete(collegeDepartmentsToPrograms)
            .where(
              and(
                eq(
                  collegeDepartmentsToPrograms.collegeDepartmentId,
                  collegeDepartmentId,
                ),
                eq(collegeDepartmentsToPrograms.programId, programId),
              ),
            );
          return { success: true };
        },
        { role: "admin" },
      )
      .post(
        "/:id/departments/:departmentId/programs/:programId/courses",
        async ({
          params: { id: collegeId, departmentId, programId },
          body,
        }) => {
          const courseIds = body.courseIds;
          const collegeDepartmentProgramIds = await db
            .select({ id: collegeDepartmentsToPrograms.id })
            .from(collegeDepartmentsToPrograms)
            .innerJoin(
              collegeDepartments,
              eq(
                collegeDepartments.id,
                collegeDepartmentsToPrograms.collegeDepartmentId,
              ),
            )
            .where(
              and(
                eq(collegeDepartments.collegeId, collegeId),
                eq(collegeDepartments.departmentId, departmentId),
                eq(collegeDepartmentsToPrograms.programId, programId),
              ),
            )
            .limit(1);
          const collegeDepartmentProgramId =
            collegeDepartmentProgramIds?.[0]?.id;

          if (!collegeDepartmentProgramId) {
            return {
              success: false,
              error: "College department program not found",
            };
          }

          const currentCourseIds = await db
            .select({ courseId: collegeDepartmentProgramToCourses.courseId })
            .from(collegeDepartmentProgramToCourses)
            .where(
              eq(
                collegeDepartmentProgramToCourses.programId,
                collegeDepartmentProgramId,
              ),
            );

          const currentCourseIdSet = new Set(
            currentCourseIds.map((course) => course.courseId),
          );
          const inputCourseIdSet = new Set(courseIds);

          const newCourseIds = inputCourseIdSet.difference(currentCourseIdSet);
          const removedCourseIds =
            currentCourseIdSet.difference(inputCourseIdSet);

          if (removedCourseIds.size > 0) {
            await db
              .update(collegeDepartmentProgramToCourses)
              .set({ isActive: false })
              .where(
                and(
                  eq(
                    collegeDepartmentProgramToCourses.programId,
                    collegeDepartmentProgramId,
                  ),
                  inArray(
                    collegeDepartmentProgramToCourses.courseId,
                    Array.from(removedCourseIds),
                  ),
                ),
              );
          }

          if (newCourseIds.size > 0) {
            await db.insert(collegeDepartmentProgramToCourses).values(
              Array.from(newCourseIds).map((courseId) => ({
                id: nanoid(),
                programId: collegeDepartmentProgramId,
                courseId,
              })),
            );
          }

          return {
            success: true,
            data: { added: newCourseIds.size, removed: removedCourseIds.size },
          };
        },

        {
          role: "admin",
          body: t.Object({
            courseIds: t.Array(t.String()),
          }),
        },
      )
      .patch(
        "/:id/departments/:departmentId/programs/:programId/courses/:courseId",
        async ({
          params: { id: collegeId, departmentId, programId, courseId },
          body,
        }) => {
          const collegeDepartmentProgramCourseIds = await db
            .select({ id: collegeDepartmentProgramToCourses.id })
            .from(collegeDepartmentProgramToCourses)
            .innerJoin(
              collegeDepartmentsToPrograms,
              eq(
                collegeDepartmentsToPrograms.id,
                collegeDepartmentProgramToCourses.programId,
              ),
            )
            .innerJoin(
              collegeDepartments,
              eq(
                collegeDepartments.id,
                collegeDepartmentsToPrograms.collegeDepartmentId,
              ),
            )
            .where(
              and(
                eq(collegeDepartments.collegeId, collegeId),
                eq(collegeDepartments.departmentId, departmentId),
                eq(collegeDepartmentsToPrograms.programId, programId),
                eq(collegeDepartmentProgramToCourses.courseId, courseId),
              ),
            )
            .limit(1);
          const collegeDepartmentProgramCourseId =
            collegeDepartmentProgramCourseIds?.[0]?.id;

          if (!collegeDepartmentProgramCourseId) {
            return {
              success: false,
              error: "College department program course not found",
            };
          }

          await db
            .update(collegeDepartmentProgramToCourses)
            .set({ ...body })
            .where(
              eq(
                collegeDepartmentProgramToCourses.id,
                collegeDepartmentProgramCourseId,
              ),
            );
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            code: t.Optional(t.String()),
            description: t.Optional(t.String()),
            credits: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        },
      )
      .delete(
        "/:id/departments/:departmentId/programs/:programId/courses/:courseId",
        async ({
          params: { id: collegeId, departmentId, programId, courseId },
        }) => {
          const collegeDepartmentProgramCourseIds = await db
            .select({ id: collegeDepartmentProgramToCourses.id })
            .from(collegeDepartmentProgramToCourses)
            .innerJoin(
              collegeDepartmentsToPrograms,
              eq(
                collegeDepartmentsToPrograms.id,
                collegeDepartmentProgramToCourses.programId,
              ),
            )
            .innerJoin(
              collegeDepartments,
              eq(
                collegeDepartments.id,
                collegeDepartmentsToPrograms.collegeDepartmentId,
              ),
            )
            .where(
              and(
                eq(collegeDepartments.collegeId, collegeId),
                eq(collegeDepartments.departmentId, departmentId),
                eq(collegeDepartmentsToPrograms.programId, programId),
                eq(collegeDepartmentProgramToCourses.courseId, courseId),
              ),
            )
            .limit(1);
          const collegeDepartmentProgramCourseId =
            collegeDepartmentProgramCourseIds?.[0]?.id;

          if (!collegeDepartmentProgramCourseId) {
            return {
              success: false,
              error: "College department program course not found",
            };
          }
          await db
            .delete(collegeDepartmentProgramToCourses)
            .where(
              eq(
                collegeDepartmentProgramToCourses.id,
                collegeDepartmentProgramCourseId,
              ),
            );
          return { success: true };
        },
        { role: "admin" },
      ),
  );
