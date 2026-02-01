import { boolean, decimal, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courseUnits } from "./units";

export const courseTopics = pgTable("course_topic", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  unitId: text("unit_id")
    .notNull()
    .references(() => courseUnits.id, { onDelete: "cascade" }),
  parentTopicId: text("parent_topic_id").references(
    (): any => courseTopics.id,
    { onDelete: "set null" }
  ),
  name: text("name").notNull(),
  description: text("description"),
  priorityLevel: text("priority_level", { enum: ["core", "important", "optional"] }).notNull(),
  hours: integer("hours").notNull().default(0),
  weightage: decimal("weightage", { precision: 5, scale: 2 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isExternalReference: boolean("is_external_reference").notNull().default(false),
  externalTopicId: text("external_topic_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});
