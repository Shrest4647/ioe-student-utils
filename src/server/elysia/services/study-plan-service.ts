import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  courseTopics,
  studyPlans,
  studyPlanTopics,
  studyTasks,
  topicResourceLinks,
} from "@/server/db/schema";
import {
  buildStudySchedule,
  formatDateOnly,
  parseDateOnly,
} from "@/server/utils/study-scheduler";
import type { CourseLearningTopic } from "@/types/course-learning";
import type {
  PlanningTopic,
  StudyPlanningContext,
  StudyPlanPreview,
  StudyPlanPreviewInput,
  StudyPlanRebalancePreview,
  StudyPlanSummary,
  StudyPlanWorkspace,
  StudyWorkspaceTask,
} from "@/types/study-planner";
import { getCourseLearningView } from "./course-explorer-query-service";

export async function getCoursePlanningContext(
  courseReference: string,
): Promise<StudyPlanningContext | null> {
  const result = await getCourseLearningView(courseReference);
  if (!result) return null;

  const topics: PlanningTopic[] = [];
  for (const unit of result.view.units) {
    flattenLearningTopics(unit.topics, unit.name, topics);
  }

  return {
    course: {
      id: result.view.course.id,
      slug: result.view.course.slug,
      code: result.view.course.code,
      name: result.view.course.name,
      credits: result.view.course.credits,
    },
    topics,
  };
}

export async function buildPlanPreview(
  input: StudyPlanPreviewInput,
): Promise<StudyPlanPreview> {
  if (!input.courseSlug) return buildStudySchedule(input);

  const context = await getCoursePlanningContext(input.courseSlug);
  if (!context) {
    return buildStudySchedule({
      ...input,
      topics: [],
      subjectName: input.subjectName || "Course not found",
    });
  }

  return buildStudySchedule({
    ...input,
    courseSlug: context.course.slug,
    subjectName: context.course.name,
    topics: context.topics,
  });
}

export async function activateStudyPlan(input: {
  userId: string;
  preview: StudyPlanPreview;
  templateId?: string;
}): Promise<{ id: string; slug: string }> {
  const blockingWarning = input.preview.warnings.find(
    (warning) => warning.blocking,
  );
  if (blockingWarning) throw new Error(blockingWarning.message);
  if (input.preview.days.flatMap((day) => day.tasks).length === 0) {
    throw new Error("The plan preview does not contain any scheduled tasks.");
  }

  const context = input.preview.courseSlug
    ? await getCoursePlanningContext(input.preview.courseSlug)
    : null;
  const slug = await createUniquePlanSlug(
    input.userId,
    input.preview.subjectName,
    input.preview.examDate,
  );
  const previewTasks = input.preview.days.flatMap((day) => day.tasks);
  const persistedTasks = previewTasks.map((task) => ({
    ...task,
    id: crypto.randomUUID(),
  }));
  const dailyTasks = Object.fromEntries(
    input.preview.days.map((day) => [
      String(day.dayNumber),
      persistedTasks
        .filter((task) => task.dayNumber === day.dayNumber)
        .map((task) => ({
          id: task.id,
          slug: task.slug,
          title: task.title,
          description: task.description,
          taskType: task.taskType,
          estimatedMinutes: task.estimatedMinutes,
          courseTopicId: task.topicId,
          scheduledDate: task.scheduledDate ?? undefined,
          position: task.position,
        })),
    ]),
  );

  return db.transaction(async (tx) => {
    const [plan] = await tx
      .insert(studyPlans)
      .values({
        userId: input.userId,
        templateId: input.templateId,
        courseId: context?.course.id,
        subjectName: input.preview.subjectName,
        slug,
        goal: input.preview.goal,
        dailyMinutes: typicalDailyMinutes(input.preview),
        availability: availabilityFromPreview(input.preview),
        scheduleVersion: input.preview.scheduleVersion,
        generationInput: {
          courseSlug: input.preview.courseSlug,
          topicSlugs: input.preview.selectedTopicSlugs,
          knownTopicSlugs: input.preview.knownTopicSlugs,
          warnings: input.preview.warnings.map((warning) => warning.message),
          scheduleVersion: input.preview.scheduleVersion,
        },
        examDate: input.preview.examDate,
        startDate: input.preview.startDate,
        endDate: input.preview.examDate,
        dailyTasks,
        progressPercentage: "0",
        status: "active",
      })
      .returning({ id: studyPlans.id, slug: studyPlans.slug });

    await tx.insert(studyTasks).values(
      persistedTasks.map((task) => ({
        id: task.id,
        slug: task.slug,
        studyPlanId: plan.id,
        courseTopicId: task.topicId,
        dayNumber: task.dayNumber ?? 1,
        scheduledDate: task.scheduledDate,
        position: task.position,
        origin: "generated",
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        estimatedMinutes: task.estimatedMinutes,
      })),
    );

    if (context) {
      const topicBySlug = new Map(
        context.topics.map((topic) => [topic.slug, topic]),
      );
      const selected = input.preview.selectedTopicSlugs
        .map((topicSlug, position) => ({
          topic: topicBySlug.get(topicSlug),
          position,
        }))
        .filter(
          (
            item,
          ): item is {
            topic: PlanningTopic & { id: string };
            position: number;
          } => Boolean(item.topic?.id),
        );
      if (selected.length > 0) {
        await tx.insert(studyPlanTopics).values(
          selected.map(({ topic, position }) => ({
            studyPlanId: plan.id,
            courseTopicId: topic.id,
            position,
            included: true,
            selectionReason: input.preview.goal,
            estimatedMinutes: persistedTasks
              .filter((task) => task.topicSlug === topic.slug)
              .reduce((sum, task) => sum + task.estimatedMinutes, 0),
            masteryStatus: input.preview.knownTopicSlugs.includes(topic.slug)
              ? "reviewing"
              : "not-started",
          })),
        );
      }
    }

    return plan;
  });
}

export async function listStudyPlanSummaries(
  userId: string,
  today = currentDateOnly(),
): Promise<StudyPlanSummary[]> {
  const plans = await db
    .select()
    .from(studyPlans)
    .where(eq(studyPlans.userId, userId))
    .orderBy(sql`${studyPlans.createdAt} desc`);
  if (plans.length === 0) return [];

  const tasks = await db
    .select()
    .from(studyTasks)
    .where(
      inArray(
        studyTasks.studyPlanId,
        plans.map((plan) => plan.id),
      ),
    );

  return plans.map((plan) => {
    const planTasks = tasks.filter((task) => task.studyPlanId === plan.id);
    const effectiveDates = planTasks.map((task) => ({
      task,
      date:
        task.scheduledDate ?? legacyTaskDate(plan.startDate, task.dayNumber),
    }));
    const completedTasks = planTasks.filter((task) => task.completed).length;
    return {
      id: plan.id,
      slug: plan.slug,
      subjectName: plan.subjectName,
      courseId: plan.courseId,
      goal: plan.goal,
      examDate: plan.examDate,
      startDate: plan.startDate,
      endDate: plan.endDate,
      progressPercentage:
        planTasks.length > 0
          ? ((completedTasks / planTasks.length) * 100).toFixed(2)
          : "0",
      status: plan.status,
      totalTasks: planTasks.length,
      completedTasks,
      todayTasks: effectiveDates.filter(({ date }) => date === today).length,
      overdueTasks: effectiveDates.filter(
        ({ task, date }) => !task.completed && date < today,
      ).length,
    };
  });
}

export async function getTodayStudyTasks(
  userId: string,
  today = currentDateOnly(),
) {
  const rows = await db
    .select({ task: studyTasks, plan: studyPlans })
    .from(studyTasks)
    .innerJoin(studyPlans, eq(studyTasks.studyPlanId, studyPlans.id))
    .where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, "active")))
    .orderBy(asc(studyTasks.position));

  return rows
    .map(({ plan, task }) => ({
      planId: plan.id,
      planSlug: plan.slug,
      subjectName: plan.subjectName,
      examDate: plan.examDate,
      dayNumber: task.dayNumber,
      task: {
        id: task.id,
        slug: task.slug,
        title: task.title,
        description: task.description ?? "",
        taskType: task.taskType,
        estimatedMinutes: task.estimatedMinutes ?? 0,
        completed: task.completed ?? false,
        taskId: task.id,
        scheduledDate:
          task.scheduledDate ?? legacyTaskDate(plan.startDate, task.dayNumber),
      },
    }))
    .filter((item) => item.task.scheduledDate === today);
}

export async function getUpcomingStudyTasks(
  userId: string,
  today = currentDateOnly(),
  days = 7,
) {
  const endDate = shiftDateOnly(today, days);
  const rows = await db
    .select({ task: studyTasks, plan: studyPlans })
    .from(studyTasks)
    .innerJoin(studyPlans, eq(studyTasks.studyPlanId, studyPlans.id))
    .where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, "active")))
    .orderBy(asc(studyTasks.scheduledDate), asc(studyTasks.position));

  return rows
    .map(({ plan, task }) => ({
      planId: plan.id,
      planSlug: plan.slug,
      subjectName: plan.subjectName,
      examDate: plan.examDate,
      dayNumber: task.dayNumber,
      task: {
        id: task.id,
        slug: task.slug,
        title: task.title,
        description: task.description ?? "",
        taskType: task.taskType,
        estimatedMinutes: task.estimatedMinutes ?? 0,
        completed: task.completed ?? false,
        taskId: task.id,
        scheduledDate:
          task.scheduledDate ?? legacyTaskDate(plan.startDate, task.dayNumber),
      },
    }))
    .filter(
      (item) =>
        !item.task.completed &&
        item.task.scheduledDate > today &&
        item.task.scheduledDate <= endDate,
    );
}

export async function getStudyPlanWorkspace(
  userId: string,
  slug: string,
  today = currentDateOnly(),
): Promise<StudyPlanWorkspace | null> {
  const plan = await db.query.studyPlans.findFirst({
    where: { AND: [{ userId }, { slug }] },
  });
  if (!plan) return null;

  const resourceCount = sql<number>`(
    select count(*) from ${topicResourceLinks}
    where ${topicResourceLinks.topicId} = ${courseTopics.id}
  )`;
  const taskRows = await db
    .select({
      task: studyTasks,
      topicSlug: courseTopics.slug,
      topicName: courseTopics.name,
      resourceCount,
    })
    .from(studyTasks)
    .leftJoin(courseTopics, eq(studyTasks.courseTopicId, courseTopics.id))
    .where(eq(studyTasks.studyPlanId, plan.id))
    .orderBy(asc(studyTasks.dayNumber), asc(studyTasks.position));

  const tasks: StudyWorkspaceTask[] = taskRows.map((row) => ({
    id: row.task.id,
    slug: row.task.slug,
    dayNumber: row.task.dayNumber,
    scheduledDate:
      row.task.scheduledDate ??
      legacyTaskDate(plan.startDate, row.task.dayNumber),
    position: row.task.position,
    title: row.task.title,
    description: row.task.description,
    taskType: row.task.taskType,
    estimatedMinutes: row.task.estimatedMinutes,
    completed: row.task.completed,
    completedAt: row.task.completedAt,
    actualMinutesSpent: row.task.actualMinutesSpent,
    notes: row.task.notes,
    topic:
      row.topicSlug && row.topicName
        ? {
            slug: row.topicSlug,
            name: row.topicName,
            resourceCount: Number(row.resourceCount ?? 0),
          }
        : null,
  }));
  const completedTasks = tasks.filter((task) => task.completed).length;
  const course = plan.courseId
    ? await db.query.academicCourses.findFirst({
        where: { id: plan.courseId },
        columns: { slug: true, code: true, name: true },
      })
    : null;

  return {
    id: plan.id,
    slug: plan.slug,
    subjectName: plan.subjectName,
    courseId: plan.courseId,
    course: course ?? null,
    goal: plan.goal,
    examDate: plan.examDate,
    startDate: plan.startDate,
    endDate: plan.endDate,
    progressPercentage:
      tasks.length > 0
        ? ((completedTasks / tasks.length) * 100).toFixed(2)
        : "0",
    status: plan.status,
    totalTasks: tasks.length,
    completedTasks,
    todayTasks: tasks.filter((task) => task.scheduledDate === today).length,
    overdueTasks: tasks.filter(
      (task) =>
        !task.completed &&
        task.scheduledDate !== null &&
        task.scheduledDate < today,
    ).length,
    tasks,
    today: tasks.filter((task) => task.scheduledDate === today),
    overdue: tasks.filter(
      (task) =>
        !task.completed &&
        task.scheduledDate !== null &&
        task.scheduledDate < today,
    ),
    upcoming: tasks.filter(
      (task) =>
        !task.completed &&
        task.scheduledDate !== null &&
        task.scheduledDate > today,
    ),
  };
}

export async function updateStudyTaskBySlug(input: {
  userId: string;
  planSlug: string;
  taskSlug: string;
  completed?: boolean;
  scheduledDate?: string;
  notes?: string;
}) {
  const plan = await db.query.studyPlans.findFirst({
    where: { AND: [{ userId: input.userId }, { slug: input.planSlug }] },
    columns: { id: true, status: true },
  });
  if (!plan) return null;
  if (plan.status !== "active") {
    throw new Error("Archived study plans are read-only.");
  }

  const task = await db.query.studyTasks.findFirst({
    where: { AND: [{ studyPlanId: plan.id }, { slug: input.taskSlug }] },
  });
  if (!task) return null;

  const update: Partial<typeof studyTasks.$inferInsert> = {};
  if (input.completed !== undefined) {
    update.completed = input.completed;
    update.completedAt = input.completed ? new Date() : null;
  }
  if (input.scheduledDate !== undefined) {
    if (!parseDateOnly(input.scheduledDate)) {
      throw new Error("Choose a valid date.");
    }
    update.scheduledDate = input.scheduledDate;
  }
  if (input.notes !== undefined) update.notes = input.notes;

  const [updated] = await db
    .update(studyTasks)
    .set(update)
    .where(eq(studyTasks.id, task.id))
    .returning();
  await updateStoredProgress(plan.id);
  return updated;
}

export async function previewStudyPlanRebalance(
  userId: string,
  slug: string,
  today = currentDateOnly(),
): Promise<StudyPlanRebalancePreview | null> {
  const plan = await db.query.studyPlans.findFirst({
    where: { AND: [{ userId }, { slug }] },
  });
  if (!plan) return null;
  if (plan.status !== "active") {
    return {
      planSlug: slug,
      changes: [],
      unscheduledTaskIds: [],
      message: "Archived study plans cannot be rebalanced.",
    };
  }
  const tasks = await db
    .select()
    .from(studyTasks)
    .where(eq(studyTasks.studyPlanId, plan.id))
    .orderBy(asc(studyTasks.dayNumber), asc(studyTasks.position));
  const effective = tasks.map((task) => ({
    task,
    date: task.scheduledDate ?? legacyTaskDate(plan.startDate, task.dayNumber),
  }));
  const overdue = effective.filter(
    ({ task, date }) => !task.completed && date < today,
  );
  if (overdue.length === 0) {
    return {
      planSlug: slug,
      changes: [],
      unscheduledTaskIds: [],
      message: "There are no overdue tasks to rebalance.",
    };
  }

  const availability =
    plan.availability ?? defaultAvailability(plan.dailyMinutes);
  const candidateDays = enumerateDates(shiftDateOnly(today, 1), plan.examDate);
  const capacity = new Map(
    candidateDays.map((date) => [
      date,
      availability[weekdayKey(date)] ?? plan.dailyMinutes ?? 90,
    ]),
  );
  for (const { task, date } of effective) {
    if (date <= today || task.completed) continue;
    capacity.set(
      date,
      Math.max(0, (capacity.get(date) ?? 0) - (task.estimatedMinutes ?? 0)),
    );
  }

  const changes: StudyPlanRebalancePreview["changes"] = [];
  const unscheduledTaskIds: string[] = [];
  for (const { task, date: fromDate } of overdue) {
    const minutes = task.estimatedMinutes ?? 0;
    const toDate = candidateDays.find(
      (candidate) => (capacity.get(candidate) ?? 0) >= minutes,
    );
    if (!toDate) {
      unscheduledTaskIds.push(task.id);
      continue;
    }
    capacity.set(toDate, (capacity.get(toDate) ?? 0) - minutes);
    changes.push({
      taskId: task.id,
      taskSlug: task.slug,
      title: task.title,
      fromDate,
      toDate,
    });
  }

  return {
    planSlug: slug,
    changes,
    unscheduledTaskIds,
    message:
      unscheduledTaskIds.length > 0
        ? `${changes.length} tasks can move. ${unscheduledTaskIds.length} still do not fit before the exam.`
        : `${changes.length} overdue tasks can be spread across available study days.`,
  };
}

export async function applyStudyPlanRebalance(
  userId: string,
  slug: string,
): Promise<StudyPlanRebalancePreview | null> {
  const preview = await previewStudyPlanRebalance(userId, slug);
  if (!preview) return null;
  if (preview.changes.length === 0) return preview;

  const plan = await db.query.studyPlans.findFirst({
    where: { AND: [{ userId }, { slug }] },
    columns: { id: true },
  });
  if (!plan) return null;
  await db.transaction(async (tx) => {
    for (const change of preview.changes) {
      await tx
        .update(studyTasks)
        .set({ scheduledDate: change.toDate, origin: "rebalanced" })
        .where(
          and(
            eq(studyTasks.id, change.taskId),
            eq(studyTasks.studyPlanId, plan.id),
            eq(studyTasks.completed, false),
          ),
        );
    }
    await tx
      .update(studyPlans)
      .set({ lastRebalancedAt: new Date() })
      .where(eq(studyPlans.id, plan.id));
  });
  return preview;
}

export async function updateStoredProgress(planId: string): Promise<void> {
  const tasks = await db
    .select({ completed: studyTasks.completed })
    .from(studyTasks)
    .where(eq(studyTasks.studyPlanId, planId));
  const completed = tasks.filter((task) => task.completed).length;
  const percentage = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  await db
    .update(studyPlans)
    .set({ progressPercentage: percentage.toFixed(2) })
    .where(eq(studyPlans.id, planId));
}

async function createUniquePlanSlug(
  userId: string,
  subjectName: string,
  examDate: string,
): Promise<string> {
  const month = examDate.slice(0, 7);
  const base = `${slugify(subjectName)}-${month}`;
  let slug = base;
  let suffix = 2;
  while (
    await db.query.studyPlans.findFirst({
      where: { AND: [{ userId }, { slug }] },
      columns: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function flattenLearningTopics(
  topics: CourseLearningTopic[],
  unitName: string,
  output: PlanningTopic[],
) {
  for (const topic of topics) {
    output.push({
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      unitName,
      hours: topic.hours,
      weightage: topic.weightage,
      priority: topic.priority,
      prerequisites: topic.prerequisites.map((prerequisite) => ({
        topicSlug: prerequisite.slug,
        dependencyType: prerequisite.dependencyType,
      })),
      resourceCount: topic.resourceCount,
    });
    flattenLearningTopics(topic.children, unitName, output);
  }
}

function slugify(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "study-plan";
}

function currentDateOnly(): string {
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

function legacyTaskDate(startDate: string, dayNumber: number): string {
  const start = parseDateOnly(startDate);
  if (!start) return startDate;
  return formatDateOnly(
    new Date(start.getTime() + Math.max(0, dayNumber - 1) * 86_400_000),
  );
}

function typicalDailyMinutes(preview: StudyPlanPreview): number | undefined {
  const activeDays = preview.days.filter((day) => day.capacityMinutes > 0);
  if (activeDays.length === 0) return undefined;
  return Math.round(
    activeDays.reduce((sum, day) => sum + day.capacityMinutes, 0) /
      activeDays.length,
  );
}

function availabilityFromPreview(preview: StudyPlanPreview) {
  const values = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };
  for (const day of preview.days) {
    const date = parseDateOnly(day.date);
    if (!date) continue;
    const key = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getUTCDay()] as keyof typeof values;
    values[key] = Math.max(values[key], day.capacityMinutes);
  }
  return values;
}

function defaultAvailability(dailyMinutes: number | null) {
  const minutes = dailyMinutes ?? 90;
  return {
    monday: minutes,
    tuesday: minutes,
    wednesday: minutes,
    thursday: minutes,
    friday: minutes,
    saturday: minutes,
    sunday: 0,
  };
}

function weekdayKey(value: string) {
  const date = parseDateOnly(value);
  const keys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  return keys[date?.getUTCDay() ?? 0];
}

function shiftDateOnly(value: string, days: number): string {
  const date = parseDateOnly(value);
  if (!date) return value;
  return formatDateOnly(new Date(date.getTime() + days * 86_400_000));
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return [];
  const dates: string[] = [];
  for (
    let cursor = start;
    cursor.getTime() < end.getTime();
    cursor = new Date(cursor.getTime() + 86_400_000)
  ) {
    dates.push(formatDateOnly(cursor));
  }
  return dates;
}
