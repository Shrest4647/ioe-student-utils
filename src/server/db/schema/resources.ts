import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "../schema";

export const resourceCategories = pgTable("resource_category", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type ResourceCategory = typeof resourceCategories.$inferSelect;
export type NewResourceCategory = typeof resourceCategories.$inferInsert;

export const resourceContentTypes = pgTable("resource_content_type", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Tool', 'Ebook', 'Guide'
  description: text("description"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type ResourceContentType = typeof resourceContentTypes.$inferSelect;
export type NewResourceContentType = typeof resourceContentTypes.$inferInsert;

export const resources = pgTable("resource", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  s3Url: text("s3_url").notNull(),
  contentTypeId: text("content_type_id").references(
    () => resourceContentTypes.id,
    { onDelete: "set null" },
  ),
  uploaderId: text("uploader_id").references(() => user.id, {
    onDelete: "set null",
  }),
  isFeatured: boolean("is_featured").default(false).notNull(),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export const resourcesToCategories = pgTable(
  "resource_to_category",
  {
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => resourceCategories.id, { onDelete: "cascade" }),
  },
  (t) => [
    {
      pk: [t.resourceId, t.categoryId],
    },
  ],
);

// --- Resource Library Relations ---

export const resourceAttachments = pgTable("resource_attachment", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["file", "url"] }).notNull(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  fileFormat: text("file_format"), // NULL for URLs
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type ResourceAttachment = typeof resourceAttachments.$inferSelect;
export type NewResourceAttachment = typeof resourceAttachments.$inferInsert;
