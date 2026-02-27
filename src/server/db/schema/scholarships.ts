import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { countries, degreeLevels, fieldsOfStudy, user } from "../schema";

export const scholarships = pgTable("scholarship", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"), // Markdown supported
  providerName: text("provider_name"), // e.g. 'DAAD', 'Bill Gates Foundation'
  websiteUrl: text("website_url"),
  fundingType: text("funding_type", {
    enum: ["fully_funded", "partial", "tuition_only"],
  }),
  isActive: boolean("is_active").default(true).notNull(),
  status: text("status", {
    enum: ["active", "inactive", "archived"],
  }).default("active"),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type Scholarship = typeof scholarships.$inferSelect;
export type NewScholarship = typeof scholarships.$inferInsert;

export const scholarshipRounds = pgTable("scholarship_round", {
  id: text("id").primaryKey(),
  scholarshipId: text("scholarship_id")
    .notNull()
    .references(() => scholarships.id, { onDelete: "cascade" }),
  roundName: text("round_name"), // e.g., 'Fall 2025 Intake'
  description: text("description"), // Markdown supported
  isActive: boolean("is_active").default(false).notNull(),
  openDate: timestamp("open_date"),
  deadlineDate: timestamp("deadline_date"),
  scholarshipAmount: text("scholarship_amount"), // e.g. '$10,000 / year'
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type ScholarshipRound = typeof scholarshipRounds.$inferSelect;
export type NewScholarshipRound = typeof scholarshipRounds.$inferInsert;

// --- Scholarship Junction Tables ---

export const scholarshipsToCountries = pgTable(
  "scholarship_to_country",
  {
    scholarshipId: text("scholarship_id")
      .notNull()
      .references(() => scholarships.id, { onDelete: "cascade" }),
    countryCode: text("country_code")
      .notNull()
      .references(() => countries.code, { onDelete: "cascade" }),
  },
  (t) => [
    {
      pk: [t.scholarshipId, t.countryCode],
    },
  ],
);

export const scholarshipsToFields = pgTable(
  "scholarship_to_field",
  {
    scholarshipId: text("scholarship_id")
      .notNull()
      .references(() => scholarships.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => fieldsOfStudy.id, { onDelete: "cascade" }),
  },
  (t) => [
    {
      pk: [t.scholarshipId, t.fieldId],
    },
  ],
);

export const scholarshipsToDegrees = pgTable(
  "scholarship_to_degree",
  {
    scholarshipId: text("scholarship_id")
      .notNull()
      .references(() => scholarships.id, { onDelete: "cascade" }),
    degreeId: text("degree_id")
      .notNull()
      .references(() => degreeLevels.id, { onDelete: "cascade" }),
  },
  (t) => [
    {
      pk: [t.scholarshipId, t.degreeId],
    },
  ],
);

// --- Events & User Data ---

export const roundEvents = pgTable("round_event", {
  id: text("id").primaryKey(),
  roundId: text("round_id")
    .notNull()
    .references(() => scholarshipRounds.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., 'Interview Stage'
  date: timestamp("date").notNull(),
  type: text("type", {
    enum: ["webinar", "interview", "result_announcement", "deadline"],
  }),
  description: text("description"),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type RoundEvent = typeof roundEvents.$inferSelect;
export type NewRoundEvent = typeof roundEvents.$inferInsert;

export const userApplications = pgTable("user_application", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  roundId: text("round_id")
    .notNull()
    .references(() => scholarshipRounds.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["saved", "preparing", "submitted", "rejected", "accepted"],
  }).default("saved"),
  personalNotes: text("personal_notes"),
  deadlineReminder: timestamp("deadline_reminder"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type UserApplication = typeof userApplications.$inferSelect;
export type NewUserApplication = typeof userApplications.$inferInsert;
