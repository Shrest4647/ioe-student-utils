import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courseTopics } from "./topics";
import { courseUnits } from "./units";

export const topicPrerequisites = pgTable("topic_prerequisite", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .notNull()
    .references(() => courseTopics.id, { onDelete: "cascade" }),
  prerequisiteTopicId: text("prerequisite_topic_id")
    .notNull()
    .references(() => courseTopics.id, { onDelete: "cascade" }),
  dependencyType: text("dependency_type", {
    enum: ["strong", "weak"],
  }).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const unitPrerequisites = pgTable("unit_prerequisite", {
  id: text("id").primaryKey(),
  unitId: text("unit_id")
    .notNull()
    .references(() => courseUnits.id, { onDelete: "cascade" }),
  prerequisiteUnitId: text("prerequisite_unit_id")
    .notNull()
    .references(() => courseUnits.id, { onDelete: "cascade" }),
  dependencyType: text("dependency_type", {
    enum: ["strong", "weak"],
  }).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});
