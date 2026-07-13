import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { studyPlans, user } from "@/server/db/schema";
import {
  activateStudyPlan,
  getStudyPlanWorkspace,
  getTodayStudyTasks,
  getUpcomingStudyTasks,
  updateStudyTaskBySlug,
} from "@/server/elysia/services/study-plan-service";
import { buildStudySchedule } from "@/server/utils/study-scheduler";
import { DEFAULT_STUDY_AVAILABILITY } from "@/types/study-planner";

const runIntegration = process.env.RUN_DB_INTEGRATION_TESTS === "1";
const userId = `study-plan-test-${crypto.randomUUID()}`;
const otherUserId = `study-plan-other-${crypto.randomUUID()}`;

describe.skipIf(!runIntegration)("study plan production services", () => {
  beforeAll(async () => {
    await db.insert(user).values([
      {
        id: userId,
        name: "Study Planner Test",
        email: `${userId}@example.test`,
        role: "user",
        emailVerified: true,
      },
      {
        id: otherUserId,
        name: "Other Study Planner Test",
        email: `${otherUserId}@example.test`,
        role: "user",
        emailVerified: true,
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, userId));
    await db.delete(user).where(eq(user.id, otherUserId));
  });

  it("creates, reads, completes, and isolates the exact persisted task", async () => {
    const today = dateOnlyInKathmandu();
    const preview = buildStudySchedule({
      subjectName: "Integration Test Mathematics",
      topics: [
        {
          slug: "linear-equations",
          name: "Linear equations",
          hours: 1,
          weightage: null,
          priority: "core",
          prerequisites: [],
        },
      ],
      goal: "exam-prep",
      startDate: today,
      examDate: shiftDate(today, 4),
      availability: DEFAULT_STUDY_AVAILABILITY,
      preferredSessionMinutes: 45,
    });
    expect(preview.warnings.some((warning) => warning.blocking)).toBe(false);

    const plan = await activateStudyPlan({ userId, preview });
    const todayTasks = await getTodayStudyTasks(userId, today);
    expect(todayTasks.length).toBeGreaterThan(0);
    const firstTask = todayTasks[0].task;
    expect(firstTask.slug).toBeTruthy();

    const updated = await updateStudyTaskBySlug({
      userId,
      planSlug: plan.slug,
      taskSlug: firstTask.slug ?? "",
      completed: true,
    });
    expect(updated?.id).toBe(firstTask.id);
    expect(updated?.completed).toBe(true);

    const workspace = await getStudyPlanWorkspace(userId, plan.slug, today);
    expect(
      workspace?.tasks.find((task) => task.id === firstTask.id)?.completed,
    ).toBe(true);
    expect(Number(workspace?.progressPercentage ?? 0)).toBeGreaterThan(0);
    expect(
      await getStudyPlanWorkspace(otherUserId, plan.slug, today),
    ).toBeNull();

    const upcomingTasks = await getUpcomingStudyTasks(userId, today);
    expect(
      upcomingTasks.every(
        (item) => !item.task.completed && item.task.scheduledDate > today,
      ),
    ).toBe(true);

    await db
      .update(studyPlans)
      .set({ status: "archived" })
      .where(eq(studyPlans.id, plan.id));
    expect(
      updateStudyTaskBySlug({
        userId,
        planSlug: plan.slug,
        taskSlug: firstTask.slug ?? "",
        completed: false,
      }),
    ).rejects.toThrow("read-only");

    await db.delete(studyPlans).where(eq(studyPlans.id, plan.id));
  }, 30_000);
});

function dateOnlyInKathmandu(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}
