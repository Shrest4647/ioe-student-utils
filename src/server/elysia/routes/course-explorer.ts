import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  academicCourses,
  courseTopics,
  courseUnits,
  topicPrerequisites,
  topicResourceLinks,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

// ============================================================================
// Public Course Routes
// ============================================================================

export const courseExplorerPublicRoutes = new Elysia({
  prefix: "/course-explorer",
})
  // Get all courses with basic info
  .get(
    "/courses",
    async ({ query }) => {
      const { search, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      const whereCondition: Record<string, unknown> = {
        isActive: true,
      };

      if (search) {
        whereCondition.name = { ilike: `%${search}%` };
      }

      const results = await db.query.academicCourses.findMany({
        where: whereCondition,
        with: {
          units: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            columns: {
              id: true,
              slug: true,
              name: true,
              description: true,
              unitType: true,
              sortOrder: true,
            },
          },
        },
        limit: l,
        offset,
        orderBy: { name: "asc" },
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(academicCourses)
        .where(
          and(
            eq(academicCourses.isActive, true),
            search
              ? sql`${academicCourses.name} ILIKE ${`%${search}%`}`
              : sql`TRUE`,
          ),
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
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Course Explorer"],
        summary: "List all courses",
      },
    },
  )
  // Get course by slug with units
  .get(
    "/courses/slug/:slug",
    async ({ params: { slug }, set }) => {
      const course = await db.query.academicCourses.findFirst({
        where: { slug, isActive: true },
        with: {
          units: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            columns: {
              id: true,
              slug: true,
              name: true,
              description: true,
              unitType: true,
              sortOrder: true,
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
        tags: ["Course Explorer"],
        summary: "Get course by slug with units",
      },
    },
  )
  // Get course by ID with full details
  .get(
    "/courses/:id",
    async ({ params: { id }, set }) => {
      const course = await db.query.academicCourses.findFirst({
        where: { id, isActive: true },
        with: {
          units: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            with: {
              topics: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
                columns: {
                  id: true,
                  slug: true,
                  name: true,
                  description: true,
                  priorityLevel: true,
                  hours: true,
                  weightage: true,
                  sortOrder: true,
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
        tags: ["Course Explorer"],
        summary: "Get course by ID with units and topics",
      },
    },
  )
  // Get mindmap data for a course
  .get(
    "/courses/slug/:slug/mindmap",
    async ({ params: { slug }, query, set }) => {
      const course = await db.query.academicCourses.findFirst({
        where: { slug, isActive: true },
        with: {
          units: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            with: {
              topics: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
                with: {
                  prerequisites: {
                    with: {
                      prerequisiteTopic: {
                        columns: {
                          id: true,
                          slug: true,
                          name: true,
                        },
                      },
                    },
                  },
                  resources: {
                    with: {
                      resource: {
                        columns: {
                          id: true,
                          title: true,
                          description: true,
                          s3Url: true,
                        },
                      },
                    },
                  },
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

      // Build nodes from topics
      const nodes: Array<{
        id: string;
        label: string;
        slug: string;
        level: number;
        priority: string;
        weightage: string | null;
        hours: number;
        description: string | null;
        unitId: string;
        unitName: string;
        resources: Array<{
          id: string;
          title: string;
          relevance: string;
        }>;
      }> = [];

      for (const unit of course.units) {
        for (const topic of unit.topics) {
          nodes.push({
            id: topic.id,
            label: topic.name,
            slug: topic.slug,
            level: getPriorityLevel(topic.priorityLevel),
            priority: topic.priorityLevel,
            weightage: topic.weightage,
            hours: topic.hours,
            description: topic.description,
            unitId: unit.id,
            unitName: unit.name,
            resources: topic.resources
              .filter((r) => r.resource !== null)
              .map((r) => ({
                id: (r.resource as { id: string; title: string }).id,
                title: (r.resource as { id: string; title: string }).title,
                relevance: r.relevance as string,
              })),
          });
        }
      }

      // Build edges from prerequisites
      const edges: Array<{
        from: string;
        to: string;
        type: string;
      }> = [];

      for (const unit of course.units) {
        for (const topic of unit.topics) {
          for (const prereq of topic.prerequisites) {
            edges.push({
              from: prereq.prerequisiteTopicId,
              to: topic.id,
              type: prereq.dependencyType,
            });
          }
        }
      }

      // Apply path filtering if specified
      const path = query.path;
      let filteredNodes = nodes;
      if (path) {
        filteredNodes = filterNodesByPath(nodes, path);
      }

      const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

      return {
        success: true,
        data: {
          course: {
            id: course.id,
            name: course.name,
            slug: course.slug,
            description: course.description,
          },
          nodes: filteredNodes,
          edges: edges.filter(
            (e: { from: string; to: string }) =>
              filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to),
          ),
        },
      };
    },
    {
      query: t.Object({
        path: t.Optional(
          t.Union([
            t.Literal("exam-prep"),
            t.Literal("minimum"),
            t.Literal("all"),
          ]),
        ),
      }),
      detail: {
        tags: ["Course Explorer"],
        summary: "Get mindmap data for a course",
      },
    },
  );

// ============================================================================
// Public Unit Routes
// ============================================================================

export const courseExplorerUnitRoutes = new Elysia({
  prefix: "/course-explorer/units",
})
  .get(
    "",
    async ({ query }) => {
      const { courseId, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      const whereCondition: Record<string, unknown> = {};
      if (courseId) {
        whereCondition.courseId = courseId;
      }

      const results = await db.query.courseUnits.findMany({
        where:
          Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
        with: {
          course: {
            columns: {
              id: true,
              name: true,
            },
          },
          topics: {
            columns: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
        limit: l,
        offset,
        orderBy: { sortOrder: "asc" },
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(courseUnits)
        .where(courseId ? eq(courseUnits.courseId, courseId) : sql`TRUE`);

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
        courseId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Course Explorer"],
        summary: "List all units",
      },
    },
  )
  //Get unit by ID with topics
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const unit = await db.query.courseUnits.findFirst({
        where: { id, isActive: true },
        with: {
          course: {
            columns: {
              id: true,
              name: true,
            },
          },
          topics: {
            columns: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });

      if (!unit) {
        set.status = 404;
        return { success: false, error: "Unit not found" };
      }

      return { success: true, data: unit };
    },
    {
      detail: {
        tags: ["Course Explorer"],
        summary: "Get unit by ID",
      },
    },
  )
  // Get unit by slug with topics
  .get(
    "/slug/:slug",
    async ({ params: { slug }, set }) => {
      const unit = await db.query.courseUnits.findFirst({
        where: { slug, isActive: true },
        with: {
          course: {
            columns: {
              id: true,
              slug: true,
              name: true,
            },
          },
          topics: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            columns: {
              id: true,
              slug: true,
              name: true,
              description: true,
              priorityLevel: true,
              hours: true,
              weightage: true,
              sortOrder: true,
            },
          },
        },
      });

      if (!unit) {
        set.status = 404;
        return { success: false, error: "Unit not found" };
      }

      return { success: true, data: unit };
    },
    {
      detail: {
        tags: ["Course Explorer"],
        summary: "Get unit by slug with topics",
      },
    },
  )
  // Get unit topics
  .get(
    "/slug/:slug/topics",
    async ({ params: { slug }, set }) => {
      const unit = await db.query.courseUnits.findFirst({
        where: { slug, isActive: true },
        with: {
          topics: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!unit) {
        set.status = 404;
        return { success: false, error: "Unit not found" };
      }

      return { success: true, data: unit.topics };
    },
    {
      detail: {
        tags: ["Course Explorer"],
        summary: "Get topics for a unit",
      },
    },
  );

// ============================================================================
// Public Topic Routes
// ============================================================================

export const courseExplorerTopicRoutes = new Elysia({
  prefix: "/course-explorer/topics",
})
  .get(
    "",
    async ({ query }) => {
      const { unitId, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      const results = await db.query.courseTopics.findMany({
        where: unitId ? { unitId } : {},
        with: {
          unit: {
            columns: {
              id: true,
              name: true,
            },
          },
          parentTopic: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        limit: l,
        offset,
        orderBy: { sortOrder: "asc" },
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(courseTopics)
        .where(unitId ? eq(courseTopics.unitId, unitId) : sql`TRUE`);

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
        unitId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Course Explorer"],
        summary: "List all topics",
      },
    },
  )
  //Get topic by ID with full details
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const topic = await db.query.courseTopics.findFirst({
        where: { id, isActive: true },
        with: {
          unit: {
            columns: {
              id: true,
              name: true,
            },
          },
          parentTopic: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!topic) {
        set.status = 404;
        return { success: false, error: "Topic not found" };
      }

      return { success: true, data: topic };
    },
    {
      detail: {
        tags: ["Course Explorer"],
        summary: "Get topic by ID",
      },
    },
  )
  // Get topic by slug with full details
  .get(
    "/slug/:slug",
    async ({ params: { slug }, set }) => {
      const topic = await db.query.courseTopics.findFirst({
        where: { slug, isActive: true },
        with: {
          unit: {
            columns: {
              id: true,
              slug: true,
              name: true,
            },
            with: {
              course: {
                columns: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          },
          parentTopic: {
            columns: {
              id: true,
              slug: true,
              name: true,
            },
          },
          children: {
            where: { isActive: true },
            columns: {
              id: true,
              slug: true,
              name: true,
              priorityLevel: true,
            },
          },
          prerequisites: {
            with: {
              prerequisiteTopic: {
                columns: {
                  id: true,
                  slug: true,
                  name: true,
                  priorityLevel: true,
                },
              },
            },
          },
          resources: {
            with: {
              resource: {
                columns: {
                  id: true,
                  title: true,
                  description: true,
                  s3Url: true,
                  viewCount: true,
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!topic) {
        set.status = 404;
        return { success: false, error: "Topic not found" };
      }

      return { success: true, data: topic };
    },
    {
      detail: {
        tags: ["Course Explorer"],
        summary: "Get topic by slug with full details",
      },
    },
  )
  // Increment topic view count
  .post(
    "/slug/:slug/view",
    async ({ params: { slug }, set }) => {
      const topic = await db.query.courseTopics.findFirst({
        where: { slug },
      });

      if (!topic) {
        set.status = 404;
        return { success: false, error: "Topic not found" };
      }

      await db
        .update(courseTopics)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(courseTopics.id, topic.id));

      return { success: true };
    },
    {
      detail: {
        tags: ["Course Explorer"],
        summary: "Track topic view",
      },
    },
  );

// ============================================================================
// Admin Routes
// ============================================================================

export const courseExplorerAdminRoutes = new Elysia({
  prefix: "/course-explorer/admin",
})
  .use(authorizationPlugin)
  // ==========================================================================
  // Admin Course Routes
  // ==========================================================================
  .post(
    "/courses",
    async ({ body }) => {
      const id = nanoid();
      const slug =
        body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const code =
        body.code || body.name.toUpperCase().replace(/[^A-Z0-9]+/g, "");

      await db.insert(academicCourses).values({
        id,
        name: body.name,
        slug,
        code,
        description: body.description ?? null,
        credits: body.credits ?? null,
        isActive: body.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, data: { id, slug } };
    },
    {
      role: "admin",
      body: t.Object({
        name: t.String(),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        code: t.Optional(t.String()),
        credits: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Create course",
      },
    },
  )
  .patch(
    "/courses/:id",
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
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        code: t.Optional(t.String()),
        credits: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Update course",
      },
    },
  )
  .delete(
    "/courses/:id",
    async ({ params: { id } }) => {
      await db
        .update(academicCourses)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(academicCourses.id, id));
      return { success: true };
    },
    {
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Soft delete course",
      },
    },
  )
  //duplicate course
  .post(
    "/courses/:id/duplicate",
    async ({ params: { id } }) => {
      const course = await db.query.academicCourses.findFirst({
        where: { id, isActive: true },
      });

      if (!course) {
        return { success: false, error: "Course not found" };
      }

      const newCourse = await db
        .insert(academicCourses)
        .values({
          ...course,
          id: nanoid(),
          slug: nanoid(),
          name: course.name,
          description: course.description,
          code: course.code,
          credits: course.credits,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { success: true, data: newCourse[0] };
    },
    {
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Duplicate course",
      },
    },
  )
  // ==========================================================================
  // Admin Unit Routes
  // ==========================================================================

  .post(
    "/units",
    async ({ body }) => {
      const id = nanoid();
      const slug =
        body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      await db.insert(courseUnits).values({
        id,
        courseId: body.courseId,
        name: body.name,
        slug,
        description: body.description ?? null,
        unitType: body.unitType,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, data: { id, slug } };
    },
    {
      role: "admin",
      body: t.Object({
        courseId: t.String(),
        name: t.String(),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        unitType: t.Union([t.Literal("module"), t.Literal("chapter")]),
        sortOrder: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Create unit",
      },
    },
  )
  .patch(
    "/units/:id",
    async ({ params: { id }, body }) => {
      await db
        .update(courseUnits)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(courseUnits.id, id));
      return { success: true };
    },
    {
      role: "admin",
      body: t.Object({
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        unitType: t.Optional(
          t.Union([t.Literal("module"), t.Literal("chapter")]),
        ),
        sortOrder: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Update unit",
      },
    },
  )
  .delete(
    "/units/:id",
    async ({ params: { id } }) => {
      await db
        .update(courseUnits)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(courseUnits.id, id));
      return { success: true };
    },
    {
      role: "admin",
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Soft delete unit",
      },
    },
  )
  // ==========================================================================
  // Admin Topic Routes
  // ==========================================================================

  .post(
    "/topics",
    async ({ body }) => {
      const id = nanoid();
      const slug =
        body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      await db.insert(courseTopics).values({
        id,
        unitId: body.unitId,
        name: body.name,
        slug,
        description: body.description ?? null,
        priorityLevel: body.priorityLevel,
        hours: body.hours ?? 0,
        weightage: body.weightage ? String(body.weightage) : null,
        sortOrder: body.sortOrder ?? 0,
        parentTopicId: body.parentTopicId ?? null,
        isExternalReference: false,
        externalTopicId: null,
        isActive: body.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, data: { id, slug } };
    },
    {
      role: "admin",
      body: t.Object({
        unitId: t.String(),
        name: t.String(),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        priorityLevel: t.Union([
          t.Literal("core"),
          t.Literal("important"),
          t.Literal("optional"),
        ]),
        hours: t.Optional(t.Number()),
        weightage: t.Optional(t.Number()),
        sortOrder: t.Optional(t.Number()),
        parentTopicId: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Create topic",
      },
    },
  )
  .patch(
    "/topics/:id",
    async ({ params: { id }, body }) => {
      const updateData: Record<string, unknown> = {
        ...body,
        updatedAt: new Date(),
      };
      if (body.weightage !== undefined) {
        updateData.weightage = String(body.weightage);
      }

      await db
        .update(courseTopics)
        .set(updateData)
        .where(eq(courseTopics.id, id));
      return { success: true };
    },
    {
      role: "admin",
      body: t.Object({
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        priorityLevel: t.Optional(
          t.Union([
            t.Literal("core"),
            t.Literal("important"),
            t.Literal("optional"),
          ]),
        ),
        hours: t.Optional(t.Number()),
        weightage: t.Optional(t.Number()),
        sortOrder: t.Optional(t.Number()),
        parentTopicId: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Update topic",
      },
    },
  )
  .delete(
    "/topics/:id",
    async ({ params: { id } }) => {
      await db
        .update(courseTopics)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(courseTopics.id, id));
      return { success: true };
    },
    {
      role: "admin",
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Soft delete topic",
      },
    },
  )
  // ==========================================================================
  // Topic Prerequisites Management
  // ==========================================================================
  .post(
    "/topics/:id/prerequisites",
    async ({ params: { id }, body }) => {
      const prereqId = nanoid();

      await db.insert(topicPrerequisites).values({
        id: prereqId,
        topicId: id,
        prerequisiteTopicId: body.prerequisiteTopicId,
        dependencyType: body.dependencyType,
        createdAt: new Date(),
      });

      return { success: true, data: { id: prereqId } };
    },
    {
      role: "admin",
      body: t.Object({
        prerequisiteTopicId: t.String(),
        dependencyType: t.Union([t.Literal("strong"), t.Literal("weak")]),
      }),
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Add prerequisite to topic",
      },
    },
  )
  .delete(
    "/topics/:id/prerequisites/:prereqId",
    async ({ params: { prereqId } }) => {
      await db
        .delete(topicPrerequisites)
        .where(eq(topicPrerequisites.id, prereqId));
      return { success: true };
    },
    {
      role: "admin",
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Remove prerequisite from topic",
      },
    },
  )
  // ==========================================================================
  // Topic Resource Links Management
  // ==========================================================================
  .post(
    "/topics/:id/resources",
    async ({ params: { id }, body }) => {
      const linkId = nanoid();

      await db.insert(topicResourceLinks).values({
        id: linkId,
        topicId: id,
        resourceId: body.resourceId,
        relevance: body.relevance,
        sortOrder: body.sortOrder ?? 0,
        createdAt: new Date(),
      });

      return { success: true, data: { id: linkId } };
    },
    {
      role: "admin",
      body: t.Object({
        resourceId: t.String(),
        relevance: t.Union([
          t.Literal("primary"),
          t.Literal("supplementary"),
          t.Literal("practice"),
        ]),
        sortOrder: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Link resource to topic",
      },
    },
  )
  .delete(
    "/topics/:id/resources/:linkId",
    async ({ params: { linkId } }) => {
      await db
        .delete(topicResourceLinks)
        .where(eq(topicResourceLinks.id, linkId));
      return { success: true };
    },
    {
      role: "admin",
      detail: {
        tags: ["Course Explorer Admin"],
        summary: "Remove resource link from topic",
      },
    },
  );

// ============================================================================
// Helper Functions
// ============================================================================

function getPriorityLevel(priority: string): number {
  const levels: Record<string, number> = {
    core: 1,
    important: 2,
    optional: 3,
  };
  return levels[priority] || 2;
}

function filterNodesByPath(
  nodes: Array<{
    id: string;
    label: string;
    slug: string;
    level: number;
    priority: string;
    weightage: string | null;
    hours: number;
    description: string | null;
    unitId: string;
    unitName: string;
    resources: Array<{
      id: string;
      title: string;
      relevance: string;
    }>;
  }>,
  path: string,
): typeof nodes {
  switch (path) {
    case "exam-prep":
      // Filter for exam prep: include topics with weightage > 0
      return nodes.filter((n) => {
        const weight = n.weightage ? parseFloat(n.weightage) : 0;
        return weight > 0;
      });
    case "minimum":
      // Filter for minimum path: only core topics
      return nodes.filter((n) => n.priority === "core");
    default:
      return nodes;
  }
}
