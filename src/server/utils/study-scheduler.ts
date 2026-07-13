import type {
  PlanningTopic,
  StudyAvailability,
  StudyPlanGoal,
  StudyPlanPreview,
  StudyPlanPreviewDay,
  StudyPlanPreviewInput,
  StudyPlanPreviewTask,
  StudyPlanWarning,
  StudyTaskKind,
  WeekdayKey,
} from "@/types/study-planner";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_BY_UTC_DAY: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const GOAL_FACTOR: Record<StudyPlanGoal, number> = {
  minimum: 0.5,
  "exam-prep": 0.75,
  "full-coverage": 1,
};

const PRIORITY_FACTOR: Record<PlanningTopic["priority"], number> = {
  core: 1,
  important: 0.85,
  optional: 0.65,
};

type DraftTask = Omit<
  StudyPlanPreviewTask,
  "scheduledDate" | "dayNumber" | "position"
>;

export function buildStudySchedule(
  input: StudyPlanPreviewInput,
): StudyPlanPreview {
  const warnings: StudyPlanWarning[] = [];
  const start = parseDateOnly(input.startDate);
  const exam = parseDateOnly(input.examDate);
  const subjectName = input.subjectName?.trim() || "Study plan";
  const knownTopicSlugs = unique(input.knownTopicSlugs ?? []);

  if (!start || !exam || start.getTime() >= exam.getTime()) {
    warnings.push({
      code: "invalid-date-range",
      message: "Choose an exam date after the plan start date.",
      blocking: true,
    });
    return emptyPreview(input, subjectName, knownTopicSlugs, warnings);
  }

  const selected = selectTopics(input);
  if (selected.length === 0) {
    warnings.push({
      code: "empty-selection",
      message: "Select at least one topic to build a study plan.",
      blocking: true,
    });
    return emptyPreview(input, subjectName, knownTopicSlugs, warnings);
  }

  const orderedTopics = orderTopics(selected, warnings);
  const days = createDays(start, exam, input.availability);
  const availableMinutes = days.reduce(
    (sum, day) => sum + day.capacityMinutes,
    0,
  );

  if (availableMinutes === 0) {
    warnings.push({
      code: "no-study-days",
      message: "Add study time to at least one day before the exam.",
      blocking: true,
    });
  }

  const maxDailyCapacity = Math.max(
    15,
    ...days.map((day) => day.capacityMinutes),
  );
  const sessionMinutes = Math.max(
    15,
    Math.min(input.preferredSessionMinutes ?? 45, maxDailyCapacity),
  );
  const draftTasks = orderedTopics.flatMap((topic) =>
    createTopicTasks(
      topic,
      input.goal,
      knownTopicSlugs.includes(topic.slug),
      sessionMinutes,
    ),
  );
  const { scheduled, unscheduled } = packTasks(draftTasks, days);
  const scheduledMinutes = scheduled.reduce(
    (sum, task) => sum + task.estimatedMinutes,
    0,
  );
  const unscheduledMinutes = unscheduled.reduce(
    (sum, task) => sum + task.estimatedMinutes,
    0,
  );

  if (unscheduled.length > 0) {
    warnings.push({
      code: "insufficient-capacity",
      message: `${unscheduledMinutes} minutes do not fit before the exam. Add study time, remove topics, or choose a narrower goal.`,
      blocking: true,
    });
  }

  return {
    scheduleVersion: 1,
    subjectName,
    courseSlug: input.courseSlug,
    goal: input.goal,
    startDate: formatDateOnly(start),
    examDate: formatDateOnly(exam),
    availableMinutes,
    scheduledMinutes,
    unscheduledMinutes,
    selectedTopicSlugs: orderedTopics.map((topic) => topic.slug),
    knownTopicSlugs,
    warnings,
    days,
    unscheduledTasks: unscheduled,
  };
}

function selectTopics(input: StudyPlanPreviewInput): PlanningTopic[] {
  const topics = input.topics ?? [];
  const requested = new Set(input.topicSlugs ?? []);
  if (requested.size > 0) {
    return expandStrongPrerequisites(
      topics,
      topics.filter((topic) => requested.has(topic.slug)),
    );
  }
  if (input.goal === "minimum") {
    const core = topics.filter((topic) => topic.priority === "core");
    return expandStrongPrerequisites(topics, core.length > 0 ? core : topics);
  }
  if (input.goal === "exam-prep") {
    const examTopics = topics.filter(
      (topic) =>
        topic.priority === "core" ||
        topic.priority === "important" ||
        (topic.weightage ?? 0) > 0,
    );
    return expandStrongPrerequisites(
      topics,
      examTopics.length > 0 ? examTopics : topics,
    );
  }
  return topics;
}

function expandStrongPrerequisites(
  allTopics: PlanningTopic[],
  selectedTopics: PlanningTopic[],
): PlanningTopic[] {
  const bySlug = new Map(allTopics.map((topic) => [topic.slug, topic]));
  const included = new Set(selectedTopics.map((topic) => topic.slug));
  const pending = [...selectedTopics];

  while (pending.length > 0) {
    const topic = pending.pop();
    if (!topic) continue;
    for (const prerequisite of topic.prerequisites) {
      if (prerequisite.dependencyType !== "strong") continue;
      const prerequisiteTopic = bySlug.get(prerequisite.topicSlug);
      if (!prerequisiteTopic || included.has(prerequisiteTopic.slug)) continue;
      included.add(prerequisiteTopic.slug);
      pending.push(prerequisiteTopic);
    }
  }

  return allTopics.filter((topic) => included.has(topic.slug));
}

function orderTopics(
  topics: PlanningTopic[],
  warnings: StudyPlanWarning[],
): PlanningTopic[] {
  const bySlug = new Map(topics.map((topic) => [topic.slug, topic]));
  const sourceOrder = new Map(
    topics.map((topic, index) => [topic.slug, index]),
  );
  const indegree = new Map(topics.map((topic) => [topic.slug, 0]));
  const dependents = new Map<string, string[]>();

  for (const topic of topics) {
    for (const prerequisite of topic.prerequisites) {
      if (prerequisite.dependencyType !== "strong") continue;
      if (!bySlug.has(prerequisite.topicSlug)) {
        warnings.push({
          code: "missing-prerequisite",
          message: `${topic.name} depends on a topic outside this plan. Review the selection before starting.`,
          blocking: false,
        });
        continue;
      }
      indegree.set(topic.slug, (indegree.get(topic.slug) ?? 0) + 1);
      const list = dependents.get(prerequisite.topicSlug) ?? [];
      list.push(topic.slug);
      dependents.set(prerequisite.topicSlug, list);
    }
  }

  const ready = topics
    .filter((topic) => indegree.get(topic.slug) === 0)
    .sort(
      (a, b) => (sourceOrder.get(a.slug) ?? 0) - (sourceOrder.get(b.slug) ?? 0),
    );
  const ordered: PlanningTopic[] = [];

  while (ready.length > 0) {
    const topic = ready.shift();
    if (!topic) break;
    ordered.push(topic);
    for (const dependentSlug of dependents.get(topic.slug) ?? []) {
      const next = (indegree.get(dependentSlug) ?? 1) - 1;
      indegree.set(dependentSlug, next);
      if (next === 0) {
        const dependent = bySlug.get(dependentSlug);
        if (dependent) {
          ready.push(dependent);
          ready.sort(
            (a, b) =>
              (sourceOrder.get(a.slug) ?? 0) - (sourceOrder.get(b.slug) ?? 0),
          );
        }
      }
    }
  }

  if (ordered.length !== topics.length) {
    warnings.push({
      code: "prerequisite-cycle",
      message:
        "Some selected topics contain a prerequisite cycle. Their syllabus order was preserved for review.",
      blocking: false,
    });
    for (const topic of topics) {
      if (!ordered.some((item) => item.slug === topic.slug))
        ordered.push(topic);
    }
  }

  return ordered;
}

function createTopicTasks(
  topic: PlanningTopic,
  goal: StudyPlanGoal,
  known: boolean,
  sessionMinutes: number,
): DraftTask[] {
  const baseMinutes = Math.max(45, Math.round(topic.hours * 60));
  const weightFactor = 1 + Math.min(0.4, (topic.weightage ?? 0) / 100);
  const knownFactor = known ? 0.35 : 1;
  const totalMinutes = Math.max(
    known ? 30 : 45,
    Math.round(
      baseMinutes *
        GOAL_FACTOR[goal] *
        PRIORITY_FACTOR[topic.priority] *
        weightFactor *
        knownFactor,
    ),
  );
  const allocation = known
    ? allocateMinutes(totalMinutes, [
        ["practice", 0.7],
        ["review", 0.3],
      ])
    : allocateMinutes(totalMinutes, [
        ["learn", 0.45],
        ["practice", 0.4],
        ["review", 0.15],
      ]);
  const kindOrdinal = new Map<StudyTaskKind, number>();

  return allocation.flatMap(({ kind, minutes }) =>
    splitIntoSessions(minutes, sessionMinutes).map((estimatedMinutes) => {
      const ordinal = (kindOrdinal.get(kind) ?? 0) + 1;
      kindOrdinal.set(kind, ordinal);
      const verb =
        kind === "learn"
          ? "Learn"
          : kind === "practice"
            ? "Practice"
            : kind === "review"
              ? "Review"
              : "Prepare";
      return {
        key: `${topic.slug}-${kind}-${ordinal}`,
        slug: `${topic.slug}-${kind}-${ordinal}`,
        title: `${verb} ${topic.name}`,
        description: topic.unitName ? `From ${topic.unitName}` : "",
        taskType: kind,
        estimatedMinutes,
        topicId: topic.id,
        topicSlug: topic.slug,
        topicName: topic.name,
        resourceCount: topic.resourceCount ?? 0,
      };
    }),
  );
}

function allocateMinutes(
  total: number,
  shares: Array<[StudyTaskKind, number]>,
): Array<{ kind: StudyTaskKind; minutes: number }> {
  let allocated = 0;
  return shares.map(([kind, share], index) => {
    const minutes =
      index === shares.length - 1
        ? total - allocated
        : Math.max(1, Math.round(total * share));
    allocated += minutes;
    return { kind, minutes };
  });
}

function splitIntoSessions(total: number, sessionMinutes: number): number[] {
  const sessions: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    if (remaining < 15 && sessions.length > 0) {
      sessions[sessions.length - 1] += remaining;
      break;
    }
    const chunk = Math.min(sessionMinutes, remaining);
    sessions.push(chunk);
    remaining -= chunk;
  }
  return sessions;
}

function createDays(
  start: Date,
  exam: Date,
  availability: StudyAvailability,
): StudyPlanPreviewDay[] {
  const days: StudyPlanPreviewDay[] = [];
  for (
    let cursor = new Date(start.getTime()), dayNumber = 1;
    cursor.getTime() < exam.getTime();
    cursor = new Date(cursor.getTime() + DAY_MS), dayNumber += 1
  ) {
    const weekday = WEEKDAY_BY_UTC_DAY[cursor.getUTCDay()];
    const configured = Math.max(0, availability[weekday] ?? 0);
    const isExamEve = cursor.getTime() + DAY_MS === exam.getTime();
    days.push({
      date: formatDateOnly(cursor),
      dayNumber,
      capacityMinutes: isExamEve ? Math.min(configured, 45) : configured,
      scheduledMinutes: 0,
      tasks: [],
    });
  }
  return days;
}

function packTasks(
  tasks: DraftTask[],
  days: StudyPlanPreviewDay[],
): {
  scheduled: StudyPlanPreviewTask[];
  unscheduled: StudyPlanPreviewTask[];
} {
  const scheduled: StudyPlanPreviewTask[] = [];
  const unscheduled: StudyPlanPreviewTask[] = [];
  let earliestDayIndex = 0;

  for (const task of tasks) {
    const dayIndex = days.findIndex(
      (day, index) =>
        index >= earliestDayIndex &&
        day.capacityMinutes - day.scheduledMinutes >= task.estimatedMinutes,
    );
    if (dayIndex < 0) {
      unscheduled.push({
        ...task,
        scheduledDate: null,
        dayNumber: null,
        position: unscheduled.length,
      });
      continue;
    }

    const day = days[dayIndex];
    const scheduledTask: StudyPlanPreviewTask = {
      ...task,
      scheduledDate: day.date,
      dayNumber: day.dayNumber,
      position: day.tasks.length,
    };
    day.tasks.push(scheduledTask);
    day.scheduledMinutes += task.estimatedMinutes;
    scheduled.push(scheduledTask);
    earliestDayIndex = dayIndex;
  }

  return { scheduled, unscheduled };
}

function emptyPreview(
  input: StudyPlanPreviewInput,
  subjectName: string,
  knownTopicSlugs: string[],
  warnings: StudyPlanWarning[],
): StudyPlanPreview {
  return {
    scheduleVersion: 1,
    subjectName,
    courseSlug: input.courseSlug,
    goal: input.goal,
    startDate: input.startDate,
    examDate: input.examDate,
    availableMinutes: 0,
    scheduledMinutes: 0,
    unscheduledMinutes: 0,
    selectedTopicSlugs: [],
    knownTopicSlugs,
    warnings,
    days: [],
    unscheduledTasks: [],
  };
}

export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return formatDateOnly(date) === value ? date : null;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
