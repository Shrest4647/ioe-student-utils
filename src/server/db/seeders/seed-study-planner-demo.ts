import { and, eq } from "drizzle-orm";
import { appEnv } from "@/env";
import {
  activateStudyPlan,
  buildPlanPreview,
  getCoursePlanningContext,
} from "@/server/elysia/services/study-plan-service";
import {
  DEFAULT_STUDY_AVAILABILITY,
  type StudyPlanPreviewInput,
} from "@/types/study-planner";
import { conn, db } from "../index";
import {
  academicEvents,
  resources,
  studyLogs,
  studyPlans,
  studyTasks,
  topicResourceLinks,
} from "../schema";

const DEMO_SLUG = "data-structures-exam-prep-demo";
const DEMO_RESOURCE_ID = "study-planner-demo-opendsa";
const DEMO_RESOURCE_LINK_ID = "study-planner-demo-opendsa-link";
const DEMO_TOPIC_SLUGS = [
  "algorithm-analysis",
  "array-basics",
  "stack-implementation",
  "binary-tree-basics",
  "graph-representations",
  "bubble-selection-insertion",
];

export async function seedStudyPlannerDemo(userId: string) {
  if (appEnv.NODE_ENV === "production") {
    throw new Error("The study planner demo fixture cannot run in production.");
  }
  const targetUser = await db.query.user.findFirst({
    where: { id: userId },
    columns: { id: true },
  });
  if (!targetUser) throw new Error(`No user found for id ${userId}.`);

  let context = await getCoursePlanningContext("data-structures-algorithms");
  if (!context) {
    throw new Error(
      "Seed Course Explorer before creating the Data Structures demo plan.",
    );
  }

  const resourceTopic = context.topics.find(
    (topic) => topic.slug === "algorithm-analysis" && topic.id,
  );
  if (!resourceTopic?.id) {
    throw new Error(
      "The Data Structures fixture is missing its Algorithm Analysis topic.",
    );
  }
  await ensureDemoResource(resourceTopic.id);
  context = (await getCoursePlanningContext(context.course.slug)) ?? context;

  const today = dateOnlyInKathmandu();
  const startDate = shiftDate(today, -4);
  const examDate = shiftDate(today, 10);
  const availableTopicSlugs = new Set(
    context.topics.map((topic) => topic.slug),
  );
  const selectedTopics = DEMO_TOPIC_SLUGS.filter((slug) =>
    availableTopicSlugs.has(slug),
  );
  if (selectedTopics.length !== DEMO_TOPIC_SLUGS.length) {
    throw new Error(
      "The Data Structures fixture is missing one or more representative topics.",
    );
  }
  const input: StudyPlanPreviewInput = {
    courseSlug: context.course.slug,
    goal: "exam-prep",
    startDate,
    examDate,
    availability: DEFAULT_STUDY_AVAILABILITY,
    preferredSessionMinutes: 45,
    topicSlugs: selectedTopics,
    knownTopicSlugs: [
      "algorithm-analysis",
      "graph-representations",
      "bubble-selection-insertion",
    ],
  };
  const preview = await buildPlanPreview(input);
  if (preview.warnings.some((warning) => warning.blocking)) {
    throw new Error(
      preview.warnings.map((warning) => warning.message).join(" "),
    );
  }

  const existing = await db.query.studyPlans.findFirst({
    where: { AND: [{ userId }, { slug: DEMO_SLUG }] },
    columns: { id: true },
  });

  const activated = await activateStudyPlan({ userId, preview });

  const tasks = await db
    .select()
    .from(studyTasks)
    .where(eq(studyTasks.studyPlanId, activated.id))
    .orderBy(studyTasks.dayNumber, studyTasks.position);
  const completedCount = Math.max(1, Math.floor(tasks.length / 3));
  const completedTaskIds = new Set(
    tasks.slice(0, completedCount).map((task) => task.id),
  );
  const unfinished = tasks.filter((task) => !completedTaskIds.has(task.id));
  const overdueTask = unfinished[0];
  const todayTasks = ["learn", "practice", "review"].map((taskType) =>
    unfinished.find(
      (task) => task.id !== overdueTask?.id && task.taskType === taskType,
    ),
  );
  if (!overdueTask || todayTasks.some((task) => !task)) {
    throw new Error(
      "The generated fixture could not produce overdue, learn, practice, and review states.",
    );
  }
  const todayTaskIds = new Set(todayTasks.map((task) => task?.id));
  const yesterday = shiftDate(today, -1);
  const futureDates = Array.from({ length: 9 }, (_, index) =>
    shiftDate(today, index + 1),
  );
  let futureIndex = 0;

  await db.transaction(async (tx) => {
    const eventTitle = "Data Structures practice exam";
    const existingEvent = await tx.query.academicEvents.findFirst({
      where: { AND: [{ userId }, { title: eventTitle }] },
      columns: { id: true },
    });
    const event = existingEvent
      ? (
          await tx
            .update(academicEvents)
            .set({
              subjectName: context.course.name,
              eventType: "exam",
              description:
                "Development fixture for the study planner learning loop.",
              eventDate: examDate,
            })
            .where(eq(academicEvents.id, existingEvent.id))
            .returning({ id: academicEvents.id })
        )[0]
      : (
          await tx
            .insert(academicEvents)
            .values({
              userId,
              subjectName: context.course.name,
              eventType: "exam",
              title: eventTitle,
              description:
                "Development fixture for the study planner learning loop.",
              eventDate: examDate,
            })
            .returning({ id: academicEvents.id })
        )[0];

    if (existing) {
      await tx.delete(studyPlans).where(eq(studyPlans.id, existing.id));
    }

    for (const [index, task] of tasks.entries()) {
      const completed = completedTaskIds.has(task.id);
      const scheduledDate = completed
        ? shiftDate(today, -Math.max(1, completedCount - index))
        : task.id === overdueTask.id
          ? yesterday
          : todayTaskIds.has(task.id)
            ? today
            : futureDates[futureIndex++ % futureDates.length];
      await tx
        .update(studyTasks)
        .set({
          scheduledDate,
          completed,
          completedAt: completed ? new Date() : null,
          notes:
            index === 0
              ? "Revisit the complexity examples before the final review."
              : null,
          actualMinutesSpent: index === 0 ? 35 : null,
        })
        .where(
          and(
            eq(studyTasks.id, task.id),
            eq(studyTasks.studyPlanId, activated.id),
          ),
        );
    }
    if (tasks[0]) {
      await tx.insert(studyLogs).values({
        taskId: tasks[0].id,
        userId,
        minutesSpent: 35,
        notes: "Worked through examples and recorded remaining questions.",
      });
    }
    await tx
      .update(studyPlans)
      .set({
        slug: DEMO_SLUG,
        academicEventId: event.id,
        progressPercentage: ((completedCount / tasks.length) * 100).toFixed(2),
      })
      .where(eq(studyPlans.id, activated.id));
  });

  console.log(
    `✅ Seeded ${DEMO_SLUG} with ${tasks.length} tasks for user ${userId}.`,
  );
}

async function ensureDemoResource(topicId: string) {
  const resource = {
    title: "OpenDSA: Data Structures and Algorithms",
    description:
      "Open-source interactive material with explanations, visualizations, and practice exercises.",
    s3Url: "https://opendsa.org/OpenDSA/Books/Catalog/html/IntroDSA.html",
    isFeatured: false,
  };
  await db
    .insert(resources)
    .values({ id: DEMO_RESOURCE_ID, ...resource })
    .onConflictDoUpdate({ target: resources.id, set: resource });
  await db
    .insert(topicResourceLinks)
    .values({
      id: DEMO_RESOURCE_LINK_ID,
      topicId,
      resourceId: DEMO_RESOURCE_ID,
      relevance: "primary",
      sortOrder: 1,
    })
    .onConflictDoUpdate({
      target: topicResourceLinks.id,
      set: {
        topicId,
        resourceId: DEMO_RESOURCE_ID,
        relevance: "primary",
        sortOrder: 1,
      },
    });
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

function shiftDate(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

if (import.meta.main) {
  const userId = process.argv[2];
  if (!userId) {
    console.error(
      "Usage: bun src/server/db/seeders/seed-study-planner-demo.ts <user-id>",
    );
    process.exitCode = 1;
    await conn.end();
  } else {
    seedStudyPlannerDemo(userId)
      .catch((error) => {
        console.error("❌ Study planner demo seed failed:", error);
        process.exitCode = 1;
      })
      .finally(async () => {
        await conn.end();
      });
  }
}
