import { studyTemplates } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

interface StudyTopic {
  name: string;
  chapter?: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface GeneratePlanOptions {
  templateId: string;
  topics: StudyTopic[];
  examDate: string;
  startDate: string;
  dailyHoursAvailable?: number;
}

export async function generateStudyPlan(options: GeneratePlanOptions) {
  const template = await db.query.studyTemplates.findFirst({
    where: eq(studyTemplates.id, options.templateId),
  });

  if (!template) {
    throw new Error("Template not found");
  }

  const dailyTasks: any = {};
  const totalDays = template.durationDays;
  const topicsPerDay = Math.ceil(options.topics.length / totalDays);

  for (let day = 1; day <= totalDays; day++) {
    const startIndex = (day - 1) * topicsPerDay;
    const dayTopics = options.topics.slice(
      startIndex,
      startIndex + topicsPerDay
    );

    const tasks: any[] = [];

    for (const topic of dayTopics) {
      // Generate morning tasks
      template.dailyStructure.morning.forEach((taskPattern) => {
        tasks.push({
          id: crypto.randomUUID(),
          title: replacePlaceholders(taskPattern.template, topic, day),
          description: "",
          taskType: taskPattern.type,
          estimatedMinutes: taskPattern.estimated_minutes,
        });
      });

      // Generate afternoon tasks
      template.dailyStructure.afternoon.forEach((taskPattern) => {
        tasks.push({
          id: crypto.randomUUID(),
          title: replacePlaceholders(taskPattern.template, topic, day),
          description: "",
          taskType: taskPattern.type,
          estimatedMinutes: taskPattern.estimated_minutes,
        });
      });

      // Generate evening tasks
      template.dailyStructure.evening.forEach((taskPattern) => {
        tasks.push({
          id: crypto.randomUUID(),
          title: replacePlaceholders(taskPattern.template, topic, day),
          description: "",
          taskType: taskPattern.type,
          estimatedMinutes: taskPattern.estimated_minutes,
        });
      });
    }

    dailyTasks[day.toString()] = tasks;
  }

  return dailyTasks;
}

function replacePlaceholders(
  template: string,
  topic: StudyTopic,
  day: number
): string {
  return template
    .replace("{TOPIC}", topic.name)
    .replace("{CHAPTER}", topic.chapter || "")
    .replace("{PROBLEM_COUNT}", "5")
    .replace("{RANGE}", "related to this topic")
    .replace("{KEY_TERMS_COUNT}", "10")
    .replace("{PREVIOUS_DAY}", `Day ${day - 1}`);
}
