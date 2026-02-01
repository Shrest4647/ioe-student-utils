import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../schema";

export const countries = pgTable("country", {
  code: text("code").primaryKey(), // ISO code, e.g., 'NP', 'US'
  name: text("name").notNull(),
  region: text("region"), // e.g., 'Asia', 'Europe'
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;

export const degreeLevels = pgTable("degree_level", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Bachelors', 'Masters', 'PhD'
  rank: text("rank"), // Optional helper for sorting degrees
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type DegreeLevel = typeof degreeLevels.$inferSelect;
export type NewDegreeLevel = typeof degreeLevels.$inferInsert;

export const fieldsOfStudy = pgTable("field_of_study", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Computer Science'
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type FieldOfStudy = typeof fieldsOfStudy.$inferSelect;
export type NewFieldOfStudy = typeof fieldsOfStudy.$inferInsert;
