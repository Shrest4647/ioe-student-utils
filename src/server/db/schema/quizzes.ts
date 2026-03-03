import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../schema";

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["draft", "published", "archived"],
    })
      .notNull()
      .default("draft"),
    difficulty: text("difficulty", {
      enum: ["easy", "medium", "hard"],
    }),
    estimatedMinutes: integer("estimated_minutes"),
    timeLimitSeconds: integer("time_limit_seconds"),
    passPercentage: integer("pass_percentage").notNull().default(60),
    version: integer("version").notNull().default(1),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("quizzes_slug_idx").on(t.slug),
    index("quizzes_status_idx").on(t.status),
    index("quizzes_created_by_idx").on(t.createdById),
    index("quizzes_published_at_idx").on(t.publishedAt),
  ],
);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    orderNo: integer("order_no").notNull(),
    prompt: text("prompt").notNull(),
    hint: text("hint"),
    rationale: text("rationale"),
    questionType: text("question_type", { enum: ["single_choice"] })
      .notNull()
      .default("single_choice"),
    points: integer("points").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("quiz_questions_quiz_order_unique").on(t.quizId, t.orderNo),
    index("quiz_questions_quiz_id_idx").on(t.quizId),
    index("quiz_questions_active_idx").on(t.isActive),
  ],
);

export const quizOptions = pgTable(
  "quiz_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    orderNo: integer("order_no").notNull(),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    rationale: text("rationale"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("quiz_options_question_order_unique").on(t.questionId, t.orderNo),
    index("quiz_options_question_id_idx").on(t.questionId),
  ],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    guestSessionId: varchar("guest_session_id", { length: 255 }),
    status: text("status", {
      enum: ["in_progress", "completed", "abandoned"],
    })
      .notNull()
      .default("in_progress"),
    startedAt: timestamp("started_at")
      .$defaultFn(() => new Date())
      .notNull(),
    completedAt: timestamp("completed_at"),
    score: integer("score").notNull().default(0),
    totalQuestions: integer("total_questions").notNull().default(0),
    percentage: integer("percentage").notNull().default(0),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("quiz_attempts_quiz_id_idx").on(t.quizId),
    index("quiz_attempts_user_id_idx").on(t.userId),
    index("quiz_attempts_status_idx").on(t.status),
    index("quiz_attempts_started_at_idx").on(t.startedAt),
  ],
);

export const quizAttemptAnswers = pgTable(
  "quiz_attempt_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    selectedOptionIds: jsonb("selected_option_ids").notNull().$type<string[]>(),
    isCorrect: boolean("is_correct").notNull(),
    answeredAt: timestamp("answered_at")
      .$defaultFn(() => new Date())
      .notNull(),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  },
  (t) => [
    unique("quiz_attempt_answers_attempt_question_unique").on(
      t.attemptId,
      t.questionId,
    ),
    index("quiz_attempt_answers_attempt_id_idx").on(t.attemptId),
    index("quiz_attempt_answers_question_id_idx").on(t.questionId),
  ],
);

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;
export type QuizOption = typeof quizOptions.$inferSelect;
export type NewQuizOption = typeof quizOptions.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;
export type QuizAttemptAnswer = typeof quizAttemptAnswers.$inferSelect;
export type NewQuizAttemptAnswer = typeof quizAttemptAnswers.$inferInsert;
