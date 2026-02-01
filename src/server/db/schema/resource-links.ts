import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courseTopics } from "./topics";
import { resources } from "../schema";

export const topicResourceLinks = pgTable("topic_resource_link", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .notNull()
    .references(() => courseTopics.id, { onDelete: "cascade" }),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  relevance: text("relevance", { enum: ["primary", "supplementary", "practice"] }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const resourceTags = pgTable("resource_tag", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});
