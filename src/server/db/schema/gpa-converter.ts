import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "../schema";

export const gpaConversionStandards = pgTable(
  "gpa_conversion_standard",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(), // e.g., "WES", "Scholaro"
    description: text("description"), // Description of the conversion standard
    isActive: boolean("is_active").default(true).notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("gpa_standard_name_idx").on(t.name),
    index("gpa_standard_is_active_idx").on(t.isActive),
  ],
);

export type GPAConversionStandard = typeof gpaConversionStandards.$inferSelect;
export type NewGPAConversionStandard =
  typeof gpaConversionStandards.$inferInsert;

export const gpaConversionRanges = pgTable(
  "gpa_conversion_range",
  {
    id: text("id").primaryKey(),
    standardId: text("standard_id")
      .notNull()
      .references(() => gpaConversionStandards.id, { onDelete: "cascade" }),
    minPercentage: text("min_percentage").notNull(), // Stored as string for precision
    maxPercentage: text("max_percentage").notNull(), // Stored as string for precision
    gpaValue: text("gpa_value").notNull(), // e.g., "4.0", "3.7"
    gradeLabel: text("grade_label"), // e.g., "A", "B+"
    sortOrder: text("sort_order").notNull(), // For proper ordering of ranges
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("gpa_range_standard_id_idx").on(t.standardId),
    index("gpa_range_sort_order_idx").on(t.sortOrder),
  ],
);

export type GPAConversionRange = typeof gpaConversionRanges.$inferSelect;
export type NewGPAConversionRange = typeof gpaConversionRanges.$inferInsert;

export const gpaConversions = pgTable("gpa_conversion", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  standardId: text("standard_id")
    .notNull()
    .references(() => gpaConversionStandards.id, { onDelete: "cascade" }),
  name: text("name"), // User-given name e.g., "Semester 1"
  cumulativeGPA: text("cumulative_gpa").notNull(), // Stored as string for precision
  totalCredits: text("total_credits").notNull(),
  totalQualityPoints: text("total_quality_points").notNull(),
  courseCount: text("course_count").notNull(), // Number of courses in calculation
  calculationData: jsonb("calculation_data").notNull(), // Array of course objects
  isDeleted: boolean("is_deleted").default(false).notNull(), // Soft delete
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type GPAConversion = typeof gpaConversions.$inferSelect;
export type NewGPAConversion = typeof gpaConversions.$inferInsert;
