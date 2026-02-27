import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../schema";
export const resumeProfiles = pgTable("resume_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: jsonb("address"), // JSONB for street, city, state, postalCode, country
  nationality: text("nationality"),
  dateOfBirth: text("date_of_birth"), // Year-month format
  photoUrl: text("photo_url"), // S3 URL
  summary: text("summary"), // Professional summary/bio
  linkedIn: text("linked_in"), // LinkedIn URL
  github: text("github"), // GitHub URL
  web: text("web"), // Personal website URL
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type ResumeProfile = typeof resumeProfiles.$inferSelect;
export type NewResumeProfile = typeof resumeProfiles.$inferInsert;

export const workExperiences = pgTable("work_experience", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  jobTitle: text("job_title"),
  employer: text("employer"),
  startDate: text("start_date"), // Year-month format
  endDate: text("end_date"), // Year-month format or null for current
  city: text("city"),
  country: text("country"),
  description: text("description"), // Job description and achievements
  referenceLink: text("reference_link"), // Link to experience letter/certificate
});

export type WorkExperience = typeof workExperiences.$inferSelect;
export type NewWorkExperience = typeof workExperiences.$inferInsert;

export const educationRecords = pgTable("education_record", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  institution: text("institution"),
  qualification: text("qualification"), // e.g., "Bachelor of Science in Computer Science"
  degreeLevel: text("degree_level"), // e.g., Diploma, Bachelor, Master, PhD, Certificate
  startDate: text("start_date"), // Year-month format
  endDate: text("end_date"), // Year-month format
  graduationDate: text("graduation_date"), // Year-month format
  grade: text("grade"), // The grade/score obtained
  gradeType: text("grade_type"), // GPA-4, GPA-5, GPA-10, Percentage, etc.
  description: text("description"), // Additional details
  city: text("city"),
  country: text("country"),
  referenceLink: text("reference_link"), // Link to transcript, degree certificate
});

export type EducationRecord = typeof educationRecords.$inferSelect;
export type NewEducationRecord = typeof educationRecords.$inferInsert;

export const projectRecords = pgTable("project_record", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  name: text("name"),
  description: text("description"),
  startDate: text("start_date"), // Year-month format
  endDate: text("end_date"), // Year-month format or null for ongoing
  role: text("role"), // Role in the project
  referenceLink: text("reference_link"), // Link to project page, GitHub, etc.
});

export type ProjectRecord = typeof projectRecords.$inferSelect;
export type NewProjectRecord = typeof projectRecords.$inferInsert;

export const userSkills = pgTable("user_skill", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // programming-language, communication, technical, organizational, databases, scores, interests, etc.
  skills: jsonb("skills").notNull(), // JSONB array of skill objects
});

export type UserSkill = typeof userSkills.$inferSelect;
export type NewUserSkill = typeof userSkills.$inferInsert;

export const languageSkills = pgTable("language_skill", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  listening: text("listening"), // CEFR levels: A1, A2, B1, B2, C1, C2
  reading: text("reading"), // CEFR levels
  speaking: text("speaking"), // CEFR levels
  writing: text("writing"), // CEFR levels
  referenceLink: text("reference_link"), // Link to language certificate
});

export type LanguageSkill = typeof languageSkills.$inferSelect;
export type NewLanguageSkill = typeof languageSkills.$inferInsert;

export const positionsOfResponsibilityRecords = pgTable(
  "position_of_responsibility_record",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => resumeProfiles.id, { onDelete: "cascade" }),
    name: text("name"), // Position/role title
    description: text("description"),
    startDate: text("start_date"), // Year-month format
    endDate: text("end_date"), // Year-month format or null for current
    referenceLink: text("reference_link"), // Link to volunteering certificate
  },
);

export type PositionOfResponsibilityRecord =
  typeof positionsOfResponsibilityRecords.$inferSelect;
export type NewPositionOfResponsibilityRecord =
  typeof positionsOfResponsibilityRecords.$inferInsert;

export const certificationsRecords = pgTable("certification_record", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  name: text("name"), // Certificate/certification name
  issuer: text("issuer"), // Issuing organization
  issueDate: text("issue_date"), // Year-month format
  credentialUrl: text("credential_url"), // Link to credential/certificate
});

export type CertificationRecord = typeof certificationsRecords.$inferSelect;
export type NewCertificationRecord = typeof certificationsRecords.$inferInsert;

export const referencesRecords = pgTable("reference_record", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  name: text("name"), // Reference's name
  title: text("title"), // Reference's job title
  relation: text("relation"), // How they know the applicant
  institution: text("institution"), // If academic reference
  email: text("email"),
  phone: text("phone"),
});

export type ReferenceRecord = typeof referencesRecords.$inferSelect;
export type NewReferenceRecord = typeof referencesRecords.$inferInsert;

export const resumes = pgTable("resume", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Resume name (e.g., "Software Developer Resume")
  includedSections: jsonb("included_sections").notNull(), // JSONB array of sections with order
  designTheme: jsonb("design_theme"), // JSONB metadata for themed rendering
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
