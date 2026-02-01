import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { studyPlans, studyTasks } from "@/server/db/schema";
import { generateStudyPlan } from "@/server/utils/study-plan-generator";
import { authorizationPlugin } from "../plugins/authorization";

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
          examDate: Date | string;
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
      auth: true,
      detail: {
        tags: ["Study Plans"],
        summary: "Get today's tasks across all active plans",
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
              studyPlanId: plan.id,
              dayNumber: parseInt(dayNumber, 10),
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
            AND: [{ id: id }, { userId: user.id }],
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
      auth: true,
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
  );
