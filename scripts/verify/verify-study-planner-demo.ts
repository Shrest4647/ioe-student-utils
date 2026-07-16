import { and, eq } from "drizzle-orm";
import { conn, db } from "@/server/db";
import { studyLogs, studyPlans, studyTasks } from "@/server/db/schema";
import {
  getStudyPlanWorkspace,
  getTodayStudyTasks,
  getUpcomingStudyTasks,
} from "@/server/elysia/services/study-plan-service";

const DEMO_SLUG = "data-structures-exam-prep-demo";

export async function verifyStudyPlannerDemo(userId: string) {
  const matchingPlans = await db
    .select({
      id: studyPlans.id,
      academicEventId: studyPlans.academicEventId,
    })
    .from(studyPlans)
    .where(and(eq(studyPlans.userId, userId), eq(studyPlans.slug, DEMO_SLUG)));
  assert(
    matchingPlans.length === 1,
    `Expected one ${DEMO_SLUG} plan, found ${matchingPlans.length}.`,
  );

  const today = dateOnlyInKathmandu();
  const workspace = await getStudyPlanWorkspace(userId, DEMO_SLUG, today);
  assert(workspace, "The demo workspace could not be loaded.");
  assert(workspace.course, "The demo plan is not linked to a course.");
  assert(workspace.tasks.length > 0, "The demo plan has no tasks.");
  assert(workspace.overdue.length === 1, "Expected exactly one overdue task.");
  assert(workspace.today.length === 3, "Expected exactly three tasks today.");
  assert(workspace.upcoming.length > 0, "Expected future scheduled work.");

  const todayKinds = new Set(workspace.today.map((task) => task.taskType));
  for (const taskType of ["learn", "practice", "review"]) {
    assert(todayKinds.has(taskType), `Today's tasks are missing ${taskType}.`);
  }

  const completed = workspace.tasks.filter((task) => task.completed).length;
  const progress = completed / workspace.tasks.length;
  assert(
    progress >= 0.25 && progress <= 0.4,
    `Expected roughly one-third progress, received ${(progress * 100).toFixed(2)}%.`,
  );
  assert(
    workspace.tasks.some((task) => task.notes?.trim()),
    "Expected at least one task note.",
  );
  assert(
    workspace.tasks.every((task) => task.slug && !UUID_PATTERN.test(task.slug)),
    "Expected every task to have a readable, non-UUID slug.",
  );
  assert(
    workspace.tasks.some((task) => (task.topic?.resourceCount ?? 0) > 0),
    "Expected at least one linked topic resource.",
  );

  const todayFeed = await getTodayStudyTasks(userId, today);
  assert(
    todayFeed.length === 3,
    "The Today feed does not match the workspace.",
  );
  const upcomingFeed = await getUpcomingStudyTasks(userId, today);
  assert(upcomingFeed.length > 0, "The Upcoming feed is empty.");

  const planId = matchingPlans[0].id;
  const logs = await db
    .select({ id: studyLogs.id })
    .from(studyLogs)
    .innerJoin(studyTasks, eq(studyLogs.taskId, studyTasks.id))
    .where(eq(studyTasks.studyPlanId, planId));
  assert(logs.length > 0, "Expected at least one study time log.");

  const academicEventId = matchingPlans[0].academicEventId;
  assert(academicEventId, "The demo plan is not linked to an academic event.");
  const event = await db.query.academicEvents.findFirst({
    where: { id: academicEventId },
    columns: { id: true, eventDate: true },
  });
  assert(event, "The linked academic event does not exist.");
  assert(
    event.eventDate === workspace.examDate,
    "The academic event date does not match the plan exam date.",
  );

  return {
    slug: DEMO_SLUG,
    taskCount: workspace.tasks.length,
    completedCount: completed,
    progressPercentage: Number(workspace.progressPercentage),
    overdueCount: workspace.overdue.length,
    todayCount: workspace.today.length,
    todayTaskTypes: Array.from(todayKinds).sort(),
    upcomingCount: workspace.upcoming.length,
    linkedResourceTopics: workspace.tasks.filter(
      (task) => (task.topic?.resourceCount ?? 0) > 0,
    ).length,
    studyLogCount: logs.length,
    academicEventDate: event.eventDate,
  };
}

function assert<T>(value: T, message: string): asserts value is NonNullable<T> {
  if (!value) throw new Error(message);
}

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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (import.meta.main) {
  const userId = process.argv[2];
  if (!userId) {
    console.error(
      "Usage: bun scripts/verify/verify-study-planner-demo.ts <user-id>",
    );
    process.exitCode = 1;
    await conn.end();
  } else {
    verifyStudyPlannerDemo(userId)
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => {
        console.error("Study Planner demo verification failed:", error);
        process.exitCode = 1;
      })
      .finally(async () => {
        await conn.end();
      });
  }
}
