import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../schema";

export const flashcardDecks = pgTable(
  "flashcard_decks",
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
    language: varchar("language", { length: 16 }),
    srsAlgorithm: text("srs_algorithm", {
      enum: ["sm2", "fsrs"],
    })
      .notNull()
      .default("sm2"),
    newCardsPerDay: integer("new_cards_per_day").notNull().default(20),
    maxReviewsPerDay: integer("max_reviews_per_day").notNull().default(200),
    learningSteps: jsonb("learning_steps")
      .notNull()
      .$type<number[]>()
      .default([1, 10]),
    graduatingIntervalDays: integer("graduating_interval_days")
      .notNull()
      .default(1),
    easyIntervalDays: integer("easy_interval_days").notNull().default(4),
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
    index("flashcard_decks_slug_idx").on(t.slug),
    index("flashcard_decks_status_idx").on(t.status),
    index("flashcard_decks_created_by_idx").on(t.createdById),
    index("flashcard_decks_published_at_idx").on(t.publishedAt),
  ],
);

export const flashcardCards = pgTable(
  "flashcard_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: "cascade" }),
    orderNo: integer("order_no").notNull(),
    front: text("front").notNull(),
    back: text("back").notNull(),
    hint: text("hint"),
    explanation: text("explanation"),
    media: jsonb("media").$type<Record<string, unknown> | null>(),
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
    unique("flashcard_cards_deck_order_unique").on(t.deckId, t.orderNo),
    index("flashcard_cards_deck_id_idx").on(t.deckId),
    index("flashcard_cards_active_idx").on(t.isActive),
  ],
);

export const flashcardTags = pgTable(
  "flashcard_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull().unique(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("flashcard_tags_slug_idx").on(t.slug)],
);

export const flashcardDeckTags = pgTable(
  "flashcard_deck_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => flashcardTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("flashcard_deck_tags_deck_tag_unique").on(t.deckId, t.tagId),
    index("flashcard_deck_tags_deck_id_idx").on(t.deckId),
    index("flashcard_deck_tags_tag_id_idx").on(t.tagId),
  ],
);

export const flashcardStudySessions = pgTable(
  "flashcard_study_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: "cascade" }),
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
    cardsStudied: integer("cards_studied").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    accuracyPercentage: integer("accuracy_percentage").notNull().default(0),
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
    index("flashcard_study_sessions_deck_id_idx").on(t.deckId),
    index("flashcard_study_sessions_user_id_idx").on(t.userId),
    index("flashcard_study_sessions_status_idx").on(t.status),
    index("flashcard_study_sessions_started_at_idx").on(t.startedAt),
  ],
);

export const flashcardReviews = pgTable(
  "flashcard_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => flashcardStudySessions.id, { onDelete: "cascade" }),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => flashcardCards.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    clientReviewId: varchar("client_review_id", { length: 255 }).unique(),
    rating: text("rating", {
      enum: ["again", "hard", "good", "easy"],
    }).notNull(),
    confidence: integer("confidence"),
    studyMode: text("study_mode", {
      enum: ["adaptive", "random", "cram"],
    })
      .notNull()
      .default("adaptive"),
    responseMs: integer("response_ms"),
    wasRecalled: boolean("was_recalled").notNull(),
    reviewedAt: timestamp("reviewed_at")
      .$defaultFn(() => new Date())
      .notNull(),
    scheduledDueAt: timestamp("scheduled_due_at"),
  },
  (t) => [
    index("flashcard_reviews_session_id_idx").on(t.sessionId),
    index("flashcard_reviews_card_id_idx").on(t.cardId),
    index("flashcard_reviews_user_id_idx").on(t.userId),
    index("flashcard_reviews_reviewed_at_idx").on(t.reviewedAt),
    index("flashcard_reviews_deck_id_idx").on(t.deckId),
    index("flashcard_reviews_client_review_id_idx").on(t.clientReviewId),
  ],
);

export const flashcardUserCardStates = pgTable(
  "flashcard_user_card_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => flashcardCards.id, { onDelete: "cascade" }),
    state: text("state", {
      enum: ["new", "learning", "review", "relearning"],
    })
      .notNull()
      .default("new"),
    dueAt: timestamp("due_at")
      .$defaultFn(() => new Date())
      .notNull(),
    stability: real("stability").notNull().default(0),
    difficulty: real("difficulty").notNull().default(0),
    easeFactor: real("ease_factor").notNull().default(2.5),
    intervalDays: integer("interval_days").notNull().default(0),
    repetition: integer("repetition").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    lastReviewedAt: timestamp("last_reviewed_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("flashcard_user_card_states_user_card_unique").on(
      t.userId,
      t.cardId,
    ),
    index("flashcard_user_card_states_user_due_idx").on(t.userId, t.dueAt),
    index("flashcard_user_card_states_user_deck_idx").on(t.userId, t.deckId),
  ],
);

export const flashcardUserDeckPreferences = pgTable(
  "flashcard_user_deck_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: "cascade" }),
    studyMode: text("study_mode", {
      enum: ["adaptive", "random", "cram"],
    })
      .notNull()
      .default("adaptive"),
    schedulingAggressiveness: text("scheduling_aggressiveness", {
      enum: ["relaxed", "balanced", "intensive"],
    })
      .notNull()
      .default("balanced"),
    confidenceScale: integer("confidence_scale").notNull().default(4),
    newCardsPerDay: integer("new_cards_per_day"),
    maxReviewsPerDay: integer("max_reviews_per_day"),
    autoAdvance: boolean("auto_advance").notNull().default(true),
    showHints: boolean("show_hints").notNull().default(true),
    appearance: text("appearance", {
      enum: ["comfortable", "compact"],
    })
      .notNull()
      .default("comfortable"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("flashcard_user_deck_preferences_user_deck_unique").on(
      t.userId,
      t.deckId,
    ),
    index("flashcard_user_deck_preferences_user_idx").on(t.userId),
    index("flashcard_user_deck_preferences_deck_idx").on(t.deckId),
  ],
);

export type FlashcardDeck = typeof flashcardDecks.$inferSelect;
export type NewFlashcardDeck = typeof flashcardDecks.$inferInsert;
export type FlashcardCard = typeof flashcardCards.$inferSelect;
export type NewFlashcardCard = typeof flashcardCards.$inferInsert;
export type FlashcardTag = typeof flashcardTags.$inferSelect;
export type NewFlashcardTag = typeof flashcardTags.$inferInsert;
export type FlashcardStudySession = typeof flashcardStudySessions.$inferSelect;
export type NewFlashcardStudySession =
  typeof flashcardStudySessions.$inferInsert;
export type FlashcardReview = typeof flashcardReviews.$inferSelect;
export type NewFlashcardReview = typeof flashcardReviews.$inferInsert;
export type FlashcardUserCardState =
  typeof flashcardUserCardStates.$inferSelect;
export type NewFlashcardUserCardState =
  typeof flashcardUserCardStates.$inferInsert;
export type FlashcardUserDeckPreference =
  typeof flashcardUserDeckPreferences.$inferSelect;
export type NewFlashcardUserDeckPreference =
  typeof flashcardUserDeckPreferences.$inferInsert;
