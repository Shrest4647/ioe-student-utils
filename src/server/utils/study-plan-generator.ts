import { db } from "../db";

interface StudyTopic {
  name: string;
  chapter?: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface GeneratedTask {
  id: string;
  slug: string;
  title: string;
  description: string;
  taskType: string;
  estimatedMinutes: number;
}

type DailyTasks = Record<string, GeneratedTask[]>;

interface GeneratePlanOptions {
  templateId: string;
  topics: StudyTopic[];
  examDate: string;
  startDate: string;
  /** @deprecated Reserved for future use - will adjust task intensity based on available time */
  dailyHoursAvailable?: number;
}

// Placeholder values for template replacement
const PLACEHOLDER_VALUES = {
  PROBLEM_COUNT: "5",
  RANGE: "related to this topic",
  KEY_TERMS_COUNT: "10",
} as const;

export async function generateStudyPlan(
  options: GeneratePlanOptions,
): Promise<DailyTasks> {
  const template = await db.query.studyTemplates.findFirst({
    where: { id: options.templateId },
  });

  if (!template) {
    throw new Error("Template not found");
  }

  // Validate dates
  const start = new Date(options.startDate);
  const exam = new Date(options.examDate);

  if (start >= exam) {
    throw new Error("Start date must be before exam date");
  }

  const availableDays = Math.ceil(
    (exam.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (availableDays < template.durationDays) {
    throw new Error(
      `Not enough days between start and exam. Template requires ${template.durationDays} days.`,
    );
  }

  const dailyTasks: DailyTasks = {};
  const totalDays = template.durationDays;
  const topicsPerDay = Math.ceil(options.topics.length / totalDays);

  for (let day = 1; day <= totalDays; day++) {
    const startIndex = (day - 1) * topicsPerDay;
    const dayTopics = options.topics.slice(
      startIndex,
      startIndex + topicsPerDay,
    );

    const tasks: GeneratedTask[] = [];
    const timeSlots = ["morning", "afternoon", "evening"] as const;

    for (const topic of dayTopics) {
      for (const slot of timeSlots) {
        for (const taskPattern of template.dailyStructure[slot]) {
          const taskType = taskPattern.type;
          const slug = `${slugify(topic.name)}-${taskType}-${day}-${tasks.length + 1}`;
          tasks.push({
            id: crypto.randomUUID(),
            slug,
            title: replacePlaceholders(taskPattern.template, topic, day),
            description: "",
            taskType,
            estimatedMinutes: taskPattern.estimated_minutes,
          });
        }
      }
    }

    dailyTasks[day.toString()] = tasks;
  }

  return dailyTasks;
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "topic"
  );
}

function replacePlaceholders(
  template: string,
  topic: StudyTopic,
  day: number,
): string {
  return template
    .replace("{TOPIC}", topic.name)
    .replace("{CHAPTER}", topic.chapter || "")
    .replace("{PROBLEM_COUNT}", PLACEHOLDER_VALUES.PROBLEM_COUNT)
    .replace("{RANGE}", PLACEHOLDER_VALUES.RANGE)
    .replace("{KEY_TERMS_COUNT}", PLACEHOLDER_VALUES.KEY_TERMS_COUNT)
    .replace("{PREVIOUS_DAY}", `Day ${day - 1}`);
}
