import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { studyPlans, studyTasks, studyTemplates } from "@/server/db/schema";
import { generateStudyPlan } from "@/server/utils/study-plan-generator";
import type { StudyPlanPreviewInput } from "@/types/study-planner";
import { authorizationPlugin } from "../plugins/authorization";
import {
  activateStudyPlan,
  applyStudyPlanRebalance,
  buildPlanPreview,
  getStudyPlanWorkspace,
  getTodayStudyTasks,
  getUpcomingStudyTasks,
  listStudyPlanSummaries,
  previewStudyPlanRebalance,
  updateStudyTaskBySlug,
} from "../services/study-plan-service";

const availabilitySchema = t.Object({
  monday: t.Number({ minimum: 0, maximum: 1440 }),
  tuesday: t.Number({ minimum: 0, maximum: 1440 }),
  wednesday: t.Number({ minimum: 0, maximum: 1440 }),
  thursday: t.Number({ minimum: 0, maximum: 1440 }),
  friday: t.Number({ minimum: 0, maximum: 1440 }),
  saturday: t.Number({ minimum: 0, maximum: 1440 }),
  sunday: t.Number({ minimum: 0, maximum: 1440 }),
});

const planningTopicSchema = t.Object({
  id: t.Optional(t.String()),
  slug: t.String(),
  name: t.String(),
  unitName: t.Optional(t.String()),
  hours: t.Number({ minimum: 0 }),
  weightage: t.Union([t.Number(), t.Null()]),
  priority: t.Union([
    t.Literal("core"),
    t.Literal("important"),
    t.Literal("optional"),
  ]),
  prerequisites: t.Array(
    t.Object({
      topicSlug: t.String(),
      dependencyType: t.Union([t.Literal("strong"), t.Literal("weak")]),
    }),
  ),
  resourceCount: t.Optional(t.Number({ minimum: 0 })),
});

const previewInputSchema = t.Object({
  courseSlug: t.Optional(t.String()),
  subjectName: t.Optional(t.String()),
  topics: t.Optional(t.Array(planningTopicSchema)),
  topicSlugs: t.Optional(t.Array(t.String())),
  knownTopicSlugs: t.Optional(t.Array(t.String())),
  goal: t.Union([
    t.Literal("minimum"),
    t.Literal("exam-prep"),
    t.Literal("full-coverage"),
  ]),
  startDate: t.String(),
  examDate: t.String(),
  availability: availabilitySchema,
  preferredSessionMinutes: t.Optional(t.Number({ minimum: 15, maximum: 240 })),
});

export const studyPlansRoutes = new Elysia({ prefix: "/study-plans" })
  .use(authorizationPlugin)
  .get(
    "/templates",
    async ({ set }) => {
      try {
        const templates = await db.select().from(studyTemplates);
        return { success: true, data: templates };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching study templates:", error);
        return {
          success: false,
          error: "Failed to fetch study templates",
        };
      }
    },
    {
      detail: {
        tags: ["Study Plans"],
        summary: "Get all available study templates",
      },
    },
  )
  .get(
    "/",
    async ({ user, set }) => {
      try {
        const plans = await listStudyPlanSummaries(user.id);
        return { success: true, data: plans };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching study plans:", error);
        return {
          success: false,
          error: "Failed to fetch study plans",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Get all study plans for user",
      },
    },
  )
  .get(
    "/today",
    async ({ user, set }) => {
      try {
        const todayTasks = await getTodayStudyTasks(user.id);
        return { success: true, data: todayTasks };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching today's tasks:", error);
        return {
          success: false,
          error: "Failed to fetch today's tasks",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Get today's tasks across all active plans",
      },
    },
  )
  .get(
    "/upcoming",
    async ({ user, set }) => {
      try {
        const upcomingTasks = await getUpcomingStudyTasks(user.id);
        return { success: true, data: upcomingTasks };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching upcoming study tasks:", error);
        return {
          success: false,
          error: "Failed to fetch upcoming study tasks",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Get unfinished tasks scheduled for the next seven days",
      },
    },
  )
  .post(
    "/preview",
    async ({ body, set }) => {
      try {
        const preview = await buildPlanPreview(body as StudyPlanPreviewInput);
        return { success: true, data: preview };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Could not preview plan",
        };
      }
    },
    {
      auth: true,
      body: previewInputSchema,
      detail: {
        tags: ["Study Plans"],
        summary: "Preview a capacity-aware study plan",
      },
    },
  )
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        const preview = await buildPlanPreview(
          body.input as StudyPlanPreviewInput,
        );
        const plan = await activateStudyPlan({
          userId: user.id,
          preview,
          templateId: body.templateId,
        });
        return { success: true, data: plan };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Could not create plan",
        };
      }
    },
    {
      auth: true,
      body: t.Object({
        input: previewInputSchema,
        templateId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Study Plans"],
        summary: "Activate a capacity-aware study plan",
      },
    },
  )
  .post(
    "/create",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      try {
        const {
          templateId,
          subjectName,
          topics,
          examDate,
          startDate,
          endDate,
        } = body;

        // Validate dates
        const startDateObj = new Date(startDate);
        const examDateObj = new Date(examDate);
        const endDateObj = new Date(endDate);

        if (startDateObj >= examDateObj) {
          set.status = 400;
          return {
            success: false,
            error: "Start date must be before exam date",
          };
        }

        if (examDateObj > endDateObj) {
          set.status = 400;
          return {
            success: false,
            error: "End date must be on or after exam date",
          };
        }

        // Generate slug from subject name
        const baseSlug =
          subjectName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "study-plan";

        // Check if slug exists and generate unique one if needed
        let slug = baseSlug;
        let counter = 1;
        while (true) {
          const existing = await db.query.studyPlans.findFirst({
            where: { AND: [{ userId: user.id }, { slug }] },
          });
          if (!existing) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Generate study plan using utility
        const dailyTasks = await generateStudyPlan({
          templateId,
          topics,
          examDate,
          startDate,
        });

        // Insert study plan - Drizzle date columns expect YYYY-MM-DD strings
        const newPlan = await db
          .insert(studyPlans)
          .values({
            userId: user.id,
            templateId,
            subjectName,
            slug,
            examDate: examDateObj.toISOString().split("T")[0],
            startDate: startDateObj.toISOString().split("T")[0],
            endDate: endDateObj.toISOString().split("T")[0],
            dailyTasks,
            status: "active",
          })
          .returning();

        const plan = newPlan[0];

        // Batch insert all tasks at once
        const tasksToInsert = Object.entries(dailyTasks).flatMap(
          ([dayNumber, tasks]) =>
            tasks.map((task) => ({
              id: task.id,
              slug: task.slug,
              studyPlanId: plan.id,
              dayNumber: parseInt(dayNumber, 10),
              scheduledDate: new Date(
                startDateObj.getTime() +
                  (parseInt(dayNumber, 10) - 1) * 86_400_000,
              )
                .toISOString()
                .slice(0, 10),
              position: tasks.indexOf(task),
              origin: "generated",
              title: task.title,
              description: task.description,
              taskType: task.taskType,
              estimatedMinutes: task.estimatedMinutes,
            })),
        );

        await db.insert(studyTasks).values(tasksToInsert);

        return { success: true, data: plan };
      } catch (error) {
        set.status = 500;
        console.error("Error creating study plan:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to create study plan",
        };
      }
    },
    {
      auth: true,
      body: t.Object({
        templateId: t.String(),
        subjectName: t.String(),
        topics: t.Array(
          t.Object({
            name: t.String(),
            chapter: t.Optional(t.String()),
            difficulty: t.Optional(
              t.Union([
                t.Literal("easy"),
                t.Literal("medium"),
                t.Literal("hard"),
              ]),
            ),
          }),
        ),
        examDate: t.String(),
        startDate: t.String(),
        endDate: t.String(),
      }),
      detail: {
        tags: ["Study Plans"],
        summary: "Create new study plan",
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, user, set }) => {
      try {
        const plan = await db.query.studyPlans.findFirst({
          where: {
            AND: [{ id }, { userId: user.id }],
          },
        });

        if (!plan) {
          set.status = 404;
          return { success: false, error: "Study plan not found" };
        }

        // Get all tasks for this plan
        const tasks = await db
          .select()
          .from(studyTasks)
          .where(eq(studyTasks.studyPlanId, plan.id))
          .orderBy(studyTasks.dayNumber);

        return { success: true, data: { ...plan, tasks } };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching study plan:", error);
        return {
          success: false,
          error: "Failed to fetch study plan",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Get study plan by legacy ID",
      },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      try {
        // First check if plan exists and belongs to user
        const existing = await db.query.studyPlans.findFirst({
          where: {
            AND: [{ id: id }, { userId: user.id }],
          },
        });

        if (!existing) {
          set.status = 404;
          return { success: false, error: "Study plan not found" };
        }

        const updateData: Record<string, unknown> = { ...body };

        // Convert date strings to YYYY-MM-DD format for Drizzle date columns
        if (body.examDate) {
          updateData.examDate = new Date(body.examDate as string)
            .toISOString()
            .split("T")[0];
        }
        if (body.startDate) {
          updateData.startDate = new Date(body.startDate as string)
            .toISOString()
            .split("T")[0];
        }
        if (body.endDate) {
          updateData.endDate = new Date(body.endDate as string)
            .toISOString()
            .split("T")[0];
        }

        const updated = await db
          .update(studyPlans)
          .set(updateData)
          .where(and(eq(studyPlans.id, id), eq(studyPlans.userId, user.id)))
          .returning();

        return { success: true, data: updated[0] };
      } catch (error) {
        set.status = 500;
        console.error("Error updating study plan:", error);
        return {
          success: false,
          error: "Failed to update study plan",
        };
      }
    },
    {
      auth: true,
      body: t.Object({
        subjectName: t.Optional(t.String()),
        examDate: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        dailyTasks: t.Optional(
          t.Record(
            t.String(),
            t.Array(
              t.Object({
                id: t.String(),
                title: t.String(),
                description: t.String(),
                taskType: t.String(),
                estimatedMinutes: t.Number(),
              }),
            ),
          ),
        ),
        progressPercentage: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Study Plans"],
        summary: "Update study plan",
      },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      try {
        // First check if plan exists and belongs to user
        const existing = await db.query.studyPlans.findFirst({
          where: {
            AND: [{ id: id }, { userId: user.id }],
          },
        });

        if (!existing) {
          set.status = 404;
          return { success: false, error: "Study plan not found" };
        }

        // Soft delete - set status to archived
        await db
          .update(studyPlans)
          .set({ status: "archived" })
          .where(and(eq(studyPlans.id, id), eq(studyPlans.userId, user.id)));

        return { success: true };
      } catch (error) {
        set.status = 500;
        console.error("Error archiving study plan:", error);
        return {
          success: false,
          error: "Failed to archive study plan",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Archive study plan",
      },
    },
  )
  .post(
    "/slug/:slug/rebalance/preview",
    async ({ params: { slug }, user, set }) => {
      const preview = await previewStudyPlanRebalance(user.id, slug);
      if (!preview) {
        set.status = 404;
        return { success: false, error: "Study plan not found" };
      }
      return { success: true, data: preview };
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Preview overdue task rebalancing",
      },
    },
  )
  .post(
    "/slug/:slug/rebalance",
    async ({ params: { slug }, user, set }) => {
      const applied = await applyStudyPlanRebalance(user.id, slug);
      if (!applied) {
        set.status = 404;
        return { success: false, error: "Study plan not found" };
      }
      return { success: true, data: applied };
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Apply overdue task rebalancing",
      },
    },
  )
  .get(
    "/slug/:slug/workspace",
    async ({ params: { slug }, user, set }) => {
      try {
        const workspace = await getStudyPlanWorkspace(user.id, slug);
        if (!workspace) {
          set.status = 404;
          return { success: false, error: "Study plan not found" };
        }
        return { success: true, data: workspace };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching study workspace:", error);
        return { success: false, error: "Failed to load study plan" };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Get a study plan workspace by slug",
      },
    },
  )
  .patch(
    "/slug/:slug/tasks/:taskSlug",
    async ({ params, body, user, set }) => {
      try {
        const task = await updateStudyTaskBySlug({
          userId: user.id,
          planSlug: params.slug,
          taskSlug: params.taskSlug,
          completed: body.completed,
          scheduledDate: body.scheduledDate,
          notes: body.notes,
        });
        if (!task) {
          set.status = 404;
          return { success: false, error: "Study task not found" };
        }
        return { success: true, data: task };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Could not update task",
        };
      }
    },
    {
      auth: true,
      body: t.Object({
        completed: t.Optional(t.Boolean()),
        scheduledDate: t.Optional(t.String()),
        notes: t.Optional(t.String({ maxLength: 4000 })),
      }),
      detail: {
        tags: ["Study Tasks"],
        summary: "Update a study task by plan and task slugs",
      },
    },
  )
  .get(
    "/slug/:slug",
    async ({ params: { slug }, user, set }) => {
      try {
        const plan = await db.query.studyPlans.findFirst({
          where: {
            AND: [{ slug }, { userId: user.id }],
          },
        });

        if (!plan) {
          set.status = 404;
          return { success: false, error: "Study plan not found" };
        }

        // Get all tasks for this plan
        const tasks = await db
          .select()
          .from(studyTasks)
          .where(eq(studyTasks.studyPlanId, plan.id))
          .orderBy(studyTasks.dayNumber);

        return { success: true, data: { ...plan, tasks } };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching study plan:", error);
        return {
          success: false,
          error: "Failed to fetch study plan",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Get study plan by slug",
      },
    },
  );
