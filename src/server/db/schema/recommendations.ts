import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "../schema";
export const recommendationTemplate = pgTable(
  "recommendation_template",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category", {
      enum: ["research", "academic", "industry", "general", "country_specific"],
    }).notNull(),
    content: text("content").notNull(), // Template with placeholders like {{student_name}}
    variables: jsonb("variables")
      .$type<
        Array<{
          name: string;
          label: string;
          type: "text" | "textarea" | "date" | "select" | "multiselect";
          required: boolean;
          defaultValue?: string;
          description?: string;
          options?: string[];
        }>
      >()
      .notNull(),
    targetProgramType: text("target_program_type", {
      enum: ["phd", "masters", "job", "funding", "any"],
    }).notNull(),
    targetRegion: text("target_region", {
      enum: ["us", "uk", "eu", "asia", "global"],
    }),
    isSystemTemplate: boolean("is_system_template").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("idx_recommendation_template_category").on(t.category),
    index("idx_recommendation_template_program_type").on(t.targetProgramType),
    index("idx_recommendation_template_region").on(t.targetRegion),
    index("idx_recommendation_template_active").on(t.isActive),
    index("idx_recommendation_template_composite").on(
      t.category,
      t.targetProgramType,
      t.targetRegion,
    ),
  ],
);

export type RecommendationTemplate = typeof recommendationTemplate.$inferSelect;
export type NewRecommendationTemplate =
  typeof recommendationTemplate.$inferInsert;

export const recommendationLetter = pgTable(
  "recommendation_letter",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => recommendationTemplate.id, { onDelete: "set null" }),

    // Recommender Information
    recommenderName: text("recommender_name").notNull(),
    recommenderTitle: text("recommender_title").notNull(),
    recommenderInstitution: text("recommender_institution").notNull(),
    recommenderEmail: text("recommender_email"),
    recommenderDepartment: text("recommender_department"),

    // Target Information
    targetInstitution: text("target_institution").notNull(),
    targetProgram: text("target_program").notNull(),
    targetDepartment: text("target_department"),
    targetCountry: text("target_country").notNull(),
    purpose: text("purpose").notNull(), // admission, scholarship, job, etc.

    // Relationship & Context
    relationship: text("relationship").notNull(),
    contextOfMeeting: text("context_of_meeting"), // courses, research, etc.

    // Student Information
    studentAchievements: text("student_achievements"),
    researchExperience: text("research_experience"),
    academicPerformance: text("academic_performance"),
    personalQualities: text("personal_qualities"),
    customContent: text("custom_content"),

    // Generated Content
    finalContent: text("final_content").notNull(), // The actual letter text
    pdfUrl: text("pdf_url"), // S3 URL
    googleDocUrl: text("google_doc_url"),

    status: text("status", {
      enum: ["draft", "completed", "exported"],
    })
      .default("draft")
      .notNull(),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("idx_recommendation_letter_student_id").on(t.studentId),
    index("idx_recommendation_letter_status").on(t.status),
    index("idx_recommendation_letter_created_at").on(t.createdAt),
    index("idx_recommendation_letter_template_id").on(t.templateId),
  ],
);

export type RecommendationLetter = typeof recommendationLetter.$inferSelect;
export type NewRecommendationLetter = typeof recommendationLetter.$inferInsert;

// Saved Recommenders - for reusing recommender information
export const savedRecommender = pgTable(
  "saved_recommender",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Recommender details
    name: text("name").notNull(),
    title: text("title").notNull(),
    institution: text("institution").notNull(),
    department: text("department"),
    email: text("email"),
    phone: text("phone"),

    // Relationship information
    relationship: text("relationship"),
    contextOfMeeting: text("context_of_meeting"),

    // Metadata
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
    isActive: boolean("is_active")
      .$defaultFn(() => true)
      .notNull(),
  },
  (t) => [
    index("saved_recommender_user_id_idx").on(t.userId),
    index("saved_recommender_name_idx").on(t.name),
  ],
);

export type SavedRecommender = typeof savedRecommender.$inferSelect;
export type NewSavedRecommender = typeof savedRecommender.$inferInsert;

// Saved Target Institutions - for reusing target information
export const savedTargetInstitution = pgTable(
  "saved_target_institution",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Target details
    institution: text("institution").notNull(),
    program: text("program"),
    department: text("department"),
    country: text("country").notNull(),
    purpose: text("purpose"), // Template for purpose

    // Metadata
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
    isActive: boolean("is_active")
      .$defaultFn(() => true)
      .notNull(),
  },
  (t) => [
    index("saved_target_institution_user_id_idx").on(t.userId),
    index("saved_target_institution_institution_idx").on(t.institution),
  ],
);

export type SavedTargetInstitution = typeof savedTargetInstitution.$inferSelect;
export type NewSavedTargetInstitution =
  typeof savedTargetInstitution.$inferInsert;

// Saved Template Variables - for reusing template variable responses
export const savedTemplateVariables = pgTable(
  "saved_template_variables",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => recommendationTemplate.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // User-provided name for this saved set
    variables: jsonb("variables").notNull(), // Key-value pairs of variable responses

    // Metadata
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
    isActive: boolean("is_active")
      .$defaultFn(() => true)
      .notNull(),
  },
  (t) => [
    index("saved_template_variables_user_id_idx").on(t.userId),
    index("saved_template_variables_template_id_idx").on(t.templateId),
    index("saved_template_variables_name_idx").on(t.name),
  ],
);

export type SavedTemplateVariables = typeof savedTemplateVariables.$inferSelect;
export type NewSavedTemplateVariables =
  typeof savedTemplateVariables.$inferInsert;

export const studentProfileData = pgTable(
  "student_profile_data",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    // Academic Information
    gpa: text("gpa"), // e.g., "3.8/4.0"
    major: text("major"),
    minor: text("minor"),
    expectedGraduation: text("expected_graduation"), // e.g., "May 2025"

    // Research & Skills
    researchInterests: text("research_interests"), // JSON array or comma-separated
    skills: text("skills"), // JSON array or comma-separated

    // Achievements & Experience
    achievements: text("achievements"), // Awards, honors, etc.
    projects: text("projects"), // Research or academic projects
    workExperience: text("work_experience"),
    extracurricular: text("extracurricular"),

    // Goals
    careerGoals: text("career_goals"),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("idx_student_profile_data_user_id").on(t.userId)],
);

export type StudentProfileData = typeof studentProfileData.$inferSelect;
export type NewStudentProfileData = typeof studentProfileData.$inferInsert;
