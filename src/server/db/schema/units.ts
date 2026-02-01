import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { academicCourses } from "../schema";

export const courseUnits = pgTable("course_unit", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  courseId: text("course_id")
    .notNull()
    .references(() => academicCourses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  unitType: text("unit_type", { enum: ["module", "chapter"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});
