import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  collegeDepartmentProgramCourseToRatings,
  collegeDepartmentProgramsToRatings,
  collegeDepartmentsToRatings,
  collegeToRatings,
  ratingCategories,
  ratings,
  universityToRatings,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

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
