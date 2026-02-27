import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { studyLogs, studyPlans, studyTasks } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const studyTasksRoutes = new Elysia({ prefix: "/study-tasks" })
  .use(authorizationPlugin)
  .patch(
    "/:id/complete",
    async ({ params: { id }, user, set }) => {
      try {
        // Get the task first
        const taskData = await db
          .select()
          .from(studyTasks)
          .where(eq(studyTasks.id, id))
          .limit(1);

        if (!taskData[0]) {
          set.status = 404;
          return { success: false, error: "Task not found" };
        }

        const task = taskData[0];

        // Get the plan to verify user owns it
        const plan = await db.query.studyPlans.findFirst({
          where: {
            AND: [{ id: task.studyPlanId }, { userId: user.id }],
          },
        });

        if (!plan || plan.userId !== user.id) {
          set.status = 403;
          return { success: false, error: "Unauthorized" };
        }

        // Update task as complete
        const updated = await db
          .update(studyTasks)
          .set({
            completed: true,
            completedAt: new Date(),
          })
          .where(eq(studyTasks.id, id))
          .returning();

        // Get all tasks for the plan to calculate progress
        const allTasks = await db
          .select()
          .from(studyTasks)
          .where(eq(studyTasks.studyPlanId, task.studyPlanId));

        // Calculate progress percentage
        const completedCount = allTasks.filter((t) => t.completed).length;
        const progressPercentage = (completedCount / allTasks.length) * 100;

        // Update plan's progress
        await db
          .update(studyPlans)
          .set({ progressPercentage: progressPercentage.toString() })
          .where(eq(studyPlans.id, task.studyPlanId));

        return { success: true, data: updated[0] };
      } catch (error) {
        set.status = 500;
        console.error("Error completing task:", error);
        return {
          success: false,
          error: "Failed to complete task",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Tasks"],
        summary: "Mark task as complete",
      },
    },
  )
  .patch(
    "/:id/uncomplete",
    async ({ params: { id }, user, set }) => {
      try {
        // Get the task first
        const taskData = await db
          .select()
          .from(studyTasks)
          .where(eq(studyTasks.id, id))
          .limit(1);

        if (!taskData[0]) {
          set.status = 404;
          return { success: false, error: "Task not found" };
        }

        const task = taskData[0];

        // Get the plan to verify user owns it
        const plan = await db.query.studyPlans.findFirst({
          where: {
            AND: [{ id: task.studyPlanId }, { userId: user.id }],
          },
        });

        if (!plan || plan.userId !== user.id) {
          set.status = 403;
          return { success: false, error: "Unauthorized" };
        }

        // Update task as incomplete
        const updated = await db
          .update(studyTasks)
          .set({
            completed: false,
            completedAt: null,
          })
          .where(eq(studyTasks.id, id))
          .returning();

        // Get all tasks for the plan to calculate progress
        const allTasks = await db
          .select()
          .from(studyTasks)
          .where(eq(studyTasks.studyPlanId, task.studyPlanId));

        // Calculate progress percentage
        const completedCount = allTasks.filter((t) => t.completed).length;
        const progressPercentage = (completedCount / allTasks.length) * 100;

        // Update plan's progress
        await db
          .update(studyPlans)
          .set({ progressPercentage: progressPercentage.toString() })
          .where(eq(studyPlans.id, task.studyPlanId));

        return { success: true, data: updated[0] };
      } catch (error) {
        set.status = 500;
        console.error("Error uncompleting task:", error);
        return {
          success: false,
          error: "Failed to uncomplete task",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Tasks"],
        summary: "Mark task as incomplete",
      },
    },
  )
  .post(
    "/:id/log-time",
    async ({ params: { id }, body, user, set }) => {
      try {
        // Get the task first
        const taskData = await db
          .select()
          .from(studyTasks)
          .where(eq(studyTasks.id, id))
          .limit(1);

        if (!taskData[0]) {
          set.status = 404;
          return { success: false, error: "Task not found" };
        }

        const task = taskData[0];

        // Get the plan to verify user owns it
        const plan = await db.query.studyPlans.findFirst({
          where: {
            AND: [{ id: task.studyPlanId }, { userId: user.id }],
          },
        });

        if (!plan || plan.userId !== user.id) {
          set.status = 403;
          return { success: false, error: "Unauthorized" };
        }

        // Insert study log
        await db.insert(studyLogs).values({
          taskId: id,
          userId: user.id,
          minutesSpent: body.minutes,
          notes: body.notes,
          loggedAt: new Date(),
        });

        // Update task's actual minutes spent
        const newTotal = (task.actualMinutesSpent || 0) + body.minutes;

        await db
          .update(studyTasks)
          .set({ actualMinutesSpent: newTotal })
          .where(eq(studyTasks.id, id));

        return { success: true };
      } catch (error) {
        set.status = 500;
        console.error("Error logging time:", error);
        return {
          success: false,
          error: "Failed to log time",
        };
      }
    },
    {
      auth: true,
      body: t.Object({
        minutes: t.Number(),
        notes: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Study Tasks"],
        summary: "Log study time for task",
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const task = await db.query.studyTasks.findFirst({
          where: { id: id },
        });

        if (!task) {
          set.status = 404;
          return { success: false, error: "Task not found" };
        }

        return { success: true, data: task };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching task:", error);
        return {
          success: false,
          error: "Failed to fetch task",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Study Tasks"],
        summary: "Get task by ID",
      },
    },
  );
