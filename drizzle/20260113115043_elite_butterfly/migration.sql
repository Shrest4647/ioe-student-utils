CREATE TABLE "certification_record" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"name" text,
	"issuer" text,
	"issue_date" text,
	"credential_url" text
);
--> statement-breakpoint
CREATE TABLE "education_record" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"institution" text,
	"qualification" text,
	"degree_level" text,
	"start_date" text,
	"end_date" text,
	"graduation_date" text,
	"grade" text,
	"grade_type" text,
	"description" text,
	"city" text,
	"country" text,
	"reference_link" text
);
--> statement-breakpoint
CREATE TABLE "language_skill" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"language" text NOT NULL,
	"listening" text,
	"reading" text,
	"speaking" text,
	"writing" text,
	"reference_link" text
);
--> statement-breakpoint
CREATE TABLE "position_of_responsibility_record" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"name" text,
	"description" text,
	"start_date" text,
	"end_date" text,
	"reference_link" text
);
--> statement-breakpoint
CREATE TABLE "project_record" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"name" text,
	"description" text,
	"start_date" text,
	"end_date" text,
	"role" text,
	"reference_link" text
);
--> statement-breakpoint
CREATE TABLE "reference_record" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"name" text,
	"title" text,
	"relation" text,
	"institution" text,
	"email" text,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "resume_profile" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" jsonb,
	"nationality" text,
	"date_of_birth" text,
	"photo_url" text,
	"summary" text,
	"linked_in" text,
	"github" text,
	"web" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "resume" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"name" text NOT NULL,
	"included_sections" jsonb NOT NULL,
	"design_theme" jsonb,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_skill" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"category" text NOT NULL,
	"skills" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_experience" (
	"id" text PRIMARY KEY,
	"profile_id" text NOT NULL,
	"job_title" text,
	"employer" text,
	"start_date" text,
	"end_date" text,
	"city" text,
	"country" text,
	"description" text,
	"reference_link" text
);
--> statement-breakpoint
ALTER TABLE "certification_record" ADD CONSTRAINT "certification_record_profile_id_resume_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "education_record" ADD CONSTRAINT "education_record_profile_id_resume_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "language_skill" ADD CONSTRAINT "language_skill_profile_id_resume_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "position_of_responsibility_record" ADD CONSTRAINT "position_of_responsibility_record_9K81GE7oLvVi_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_record" ADD CONSTRAINT "project_record_profile_id_resume_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reference_record" ADD CONSTRAINT "reference_record_profile_id_resume_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "resume_profile" ADD CONSTRAINT "resume_profile_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "resume" ADD CONSTRAINT "resume_profile_id_resume_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_skill" ADD CONSTRAINT "user_skill_profile_id_resume_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_experience" ADD CONSTRAINT "work_experience_profile_id_resume_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "resume_profile"("id") ON DELETE CASCADE;