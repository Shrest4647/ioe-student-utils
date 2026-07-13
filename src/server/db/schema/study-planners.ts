import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../schema";
import { courseTopics } from "./topics";
import { academicCourses } from "./universities";

export type StudyPlanGoal = "minimum" | "exam-prep" | "full-coverage";

export interface StudyPlanAvailability {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface StudyPlanGenerationInput {
  courseSlug?: string;
  topicSlugs?: string[];
  knownTopicSlugs?: string[];
  warnings?: string[];
  scheduleVersion?: number;
}

export const academicEvents = pgTable(
  "academic_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subjectName: varchar("subject_name", { length: 255 }).notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(), // 'exam', 'assignment', 'project', 'lab'
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    eventDate: date("event_date").notNull(),
    eventTime: time("event_time"),
    location: varchar("location", { length: 255 }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("academic_event_user_id_idx").on(t.userId),
    index("academic_event_date_idx").on(t.eventDate),
  ],
);

export type AcademicEvent = typeof academicEvents.$inferSelect;
export type NewAcademicEvent = typeof academicEvents.$inferInsert;

export const studyTemplates = pgTable(
  "study_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    durationDays: integer("duration_days").notNull(),
    difficultyLevel: varchar("difficulty_level", { length: 50 }),
    planningMode: varchar("planning_mode", { length: 50 }),
    version: integer("version").notNull().default(1),
    dailyStructure: jsonb("daily_structure").notNull().$type<{
      morning: Array<{
        type: string;
        template: string;
        estimated_minutes: number;
      }>;
      afternoon: Array<{
        type: string;
        template: string;
        estimated_minutes: number;
      }>;
      evening: Array<{
        type: string;
        template: string;
        estimated_minutes: number;
      }>;
    }>(),
    intensityCurve: jsonb("intensity_curve").notNull().$type<{
      [key: string]: string;
    }>(),
    subjectArea: varchar("subject_area", { length: 100 }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("study_templates_subject_area_idx").on(t.subjectArea),
    index("study_templates_difficulty_idx").on(t.difficultyLevel),
  ],
);

export type StudyTemplate = typeof studyTemplates.$inferSelect;
export type NewStudyTemplate = typeof studyTemplates.$inferInsert;

export const studyPlans = pgTable(
  "study_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => studyTemplates.id),
    courseId: text("course_id").references(() => academicCourses.id, {
      onDelete: "set null",
    }),
    academicEventId: uuid("academic_event_id").references(
      () => academicEvents.id,
      { onDelete: "set null" },
    ),
    subjectName: varchar("subject_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    goal: varchar("goal", { length: 50 }),
    dailyMinutes: integer("daily_minutes"),
    availability: jsonb("availability").$type<StudyPlanAvailability>(),
    scheduleVersion: integer("schedule_version").notNull().default(1),
    generationInput:
      jsonb("generation_input").$type<StudyPlanGenerationInput>(),
    lastRebalancedAt: timestamp("last_rebalanced_at"),
    examDate: date("exam_date").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    dailyTasks: jsonb("daily_tasks").notNull().$type<{
      [dayNumber: string]: Array<{
        id: string;
        title: string;
        description: string;
        taskType: string;
        estimatedMinutes: number;
        slug?: string;
        courseTopicId?: string;
        scheduledDate?: string;
        position?: number;
      }>;
    }>(),
    progressPercentage: decimal("progress_percentage", {
      precision: 5,
      scale: 2,
    }),
    status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'completed', 'archived'
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("study_plans_user_id_idx").on(t.userId),
    index("study_plans_status_idx").on(t.status),
    index("study_plans_exam_date_idx").on(t.examDate),
    index("study_plans_slug_idx").on(t.slug),
    uniqueIndex("study_plans_user_slug_idx").on(t.userId, t.slug),
    index("study_plans_course_id_idx").on(t.courseId),
  ],
);

export type StudyPlan = typeof studyPlans.$inferSelect;
export type NewStudyPlan = typeof studyPlans.$inferInsert;

export const studyPlanTopics = pgTable(
  "study_plan_topics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studyPlanId: uuid("study_plan_id")
      .notNull()
      .references(() => studyPlans.id, { onDelete: "cascade" }),
    courseTopicId: text("course_topic_id")
      .notNull()
      .references(() => courseTopics.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    included: boolean("included").notNull().default(true),
    selectionReason: varchar("selection_reason", { length: 100 }),
    estimatedMinutes: integer("estimated_minutes"),
    masteryStatus: varchar("mastery_status", { length: 50 })
      .notNull()
      .default("not-started"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("study_plan_topics_plan_topic_idx").on(
      t.studyPlanId,
      t.courseTopicId,
    ),
    index("study_plan_topics_plan_id_idx").on(t.studyPlanId),
    index("study_plan_topics_topic_id_idx").on(t.courseTopicId),
  ],
);

export type StudyPlanTopic = typeof studyPlanTopics.$inferSelect;
export type NewStudyPlanTopic = typeof studyPlanTopics.$inferInsert;

export const studyTasks = pgTable(
  "study_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 160 }),
    studyPlanId: uuid("study_plan_id")
      .notNull()
      .references(() => studyPlans.id, { onDelete: "cascade" }),
    courseTopicId: text("course_topic_id").references(() => courseTopics.id, {
      onDelete: "set null",
    }),
    dayNumber: integer("day_number").notNull(),
    scheduledDate: date("scheduled_date"),
    position: integer("position").notNull().default(0),
    origin: varchar("origin", { length: 50 }),
    availableAfter: timestamp("available_after"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    taskType: varchar("task_type", { length: 50 }).notNull(), // 'learn', 'practice', 'review', 'prepare'
    estimatedMinutes: integer("estimated_minutes"),
    completed: boolean("completed").default(false),
    completedAt: timestamp("completed_at"),
    actualMinutesSpent: integer("actual_minutes_spent"),
    notes: text("notes"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("study_tasks_study_plan_id_idx").on(t.studyPlanId),
    index("study_tasks_completed_idx").on(t.completed),
    index("study_tasks_day_number_idx").on(t.dayNumber),
    index("study_tasks_scheduled_date_idx").on(t.scheduledDate),
    index("study_tasks_topic_id_idx").on(t.courseTopicId),
    uniqueIndex("study_tasks_plan_slug_idx").on(t.studyPlanId, t.slug),
  ],
);

export type StudyTask = typeof studyTasks.$inferSelect;
export type NewStudyTask = typeof studyTasks.$inferInsert;

export const studyLogs = pgTable(
  "study_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => studyTasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    minutesSpent: integer("minutes_spent").notNull(),
    notes: text("notes"),
    loggedAt: timestamp("logged_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("study_logs_task_id_idx").on(t.taskId),
    index("study_logs_user_id_idx").on(t.userId),
  ],
);

export type StudyLog = typeof studyLogs.$inferSelect;
export type NewStudyLog = typeof studyLogs.$inferInsert;
