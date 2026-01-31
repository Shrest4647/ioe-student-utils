import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { studyPlans, studyTasks } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";
import { generateStudyPlan } from "../utils/study-plan-generator";

interface GeneratedTask {
  id: string;
  title: string;
  description: string;
  taskType: string;
  estimatedMinutes: number;
}

type DailyTasks = Record<string, GeneratedTask[]>;

export const studyPlansRoutes = new Elysia({ prefix: "/study-plans" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ user, set }) => {
      try {
        const plans = await db
          .select()
          .from(studyPlans)
          .where(eq(studyPlans.userId, user.id))
          .orderBy(desc(studyPlans.createdAt));

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
        // Get all active plans for the user
        const plans = await db
          .select()
          .from(studyPlans)
          .where(
            and(
              eq(studyPlans.userId, user.id),
              eq(studyPlans.status, "active"),
            ),
          );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTasks: Array<{
          planId: string;
          subjectName: string;
          examDate: Date;
          dayNumber: number;
          task: GeneratedTask;
        }> = [];

        // For each plan, calculate current day and get tasks
        for (const plan of plans) {
          const startDate = new Date(plan.startDate);
          startDate.setHours(0, 0, 0, 0);

          // Calculate day number (1-indexed)
          const dayNumber =
            Math.floor(
              (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
            ) + 1;

          // Get tasks for this day from dailyTasks
          const dailyTasks = plan.dailyTasks as DailyTasks;
          const tasksForDay = dailyTasks[dayNumber.toString()];

          if (tasksForDay) {
            for (const task of tasksForDay) {
              todayTasks.push({
                planId: plan.id,
                subjectName: plan.subjectName,
                examDate: plan.examDate,
                dayNumber,
                task,
              });
            }
          }
        }

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
      detail: {
        tags: ["Study Plans"],
        summary: "Get today's tasks across all active plans",
      },
    },
  )
  .post(
    "/create",
    async ({ body, user, set }) => {
      try {
        const {
          templateId,
          subjectName,
          topics,
          examDate,
          startDate,
          endDate,
        } = body;

        // Generate study plan using utility
        const dailyTasks = await generateStudyPlan({
          templateId,
          topics,
          examDate,
          startDate,
        });

        // Insert study plan
        const newPlan = await db
          .insert(studyPlans)
          .values({
            userId: user.id,
            templateId,
            subjectName,
            examDate: new Date(examDate),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            dailyTasks,
            status: "active",
          })
          .returning();

        const plan = newPlan[0];

        // Create individual study task records
        for (const [dayNumber, tasks] of Object.entries(dailyTasks)) {
          for (const task of tasks as GeneratedTask[]) {
            await db.insert(studyTasks).values({
              studyPlanId: plan.id,
              dayNumber: parseInt(dayNumber, 10),
              title: task.title,
              description: task.description,
              taskType: task.taskType,
              estimatedMinutes: task.estimatedMinutes,
            });
          }
        }

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
          where: and(eq(studyPlans.id, id), eq(studyPlans.userId, user.id)),
        });

        if (!plan) {
          set.status = 404;
          return { success: false, error: "Study plan not found" };
        }

        // Get all tasks for this plan
        const tasks = await db
          .select()
          .from(studyTasks)
          .where(eq(studyTasks.studyPlanId, id))
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
      detail: {
        tags: ["Study Plans"],
        summary: "Get study plan by ID",
      },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      try {
        // First check if plan exists and belongs to user
        const existing = await db.query.studyPlans.findFirst({
          where: and(eq(studyPlans.id, id), eq(studyPlans.userId, user.id)),
        });

        if (!existing) {
          set.status = 404;
          return { success: false, error: "Study plan not found" };
        }

        const updateData: Record<string, unknown> = { ...body };

        // Convert date strings to Date objects if provided
        if (body.examDate) {
          updateData.examDate = new Date(body.examDate as string);
        }
        if (body.startDate) {
          updateData.startDate = new Date(body.startDate as string);
        }
        if (body.endDate) {
          updateData.endDate = new Date(body.endDate as string);
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
      body: t.Object({
        subjectName: t.Optional(t.String()),
        examDate: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        dailyTasks: t.Optional(t.Any()),
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
          where: and(eq(studyPlans.id, id), eq(studyPlans.userId, user.id)),
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
      detail: {
        tags: ["Study Plans"],
        summary: "Archive study plan",
      },
    },
  );
