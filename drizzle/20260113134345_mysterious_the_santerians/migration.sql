CREATE TABLE "recommendation_letter" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"student_id" text NOT NULL,
	"template_id" text NOT NULL,
	"recommender_name" text NOT NULL,
	"recommender_title" text NOT NULL,
	"recommender_institution" text NOT NULL,
	"recommender_email" text,
	"recommender_department" text,
	"target_institution" text NOT NULL,
	"target_program" text NOT NULL,
	"target_department" text,
	"target_country" text NOT NULL,
	"purpose" text NOT NULL,
	"relationship" text NOT NULL,
	"context_of_meeting" text,
	"student_achievements" text,
	"research_experience" text,
	"academic_performance" text,
	"personal_qualities" text,
	"custom_content" text,
	"final_content" text NOT NULL,
	"pdf_url" text,
	"google_doc_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_template" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"variables" jsonb NOT NULL,
	"target_program_type" text NOT NULL,
	"target_region" text,
	"is_system_template" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profile_data" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL UNIQUE,
	"gpa" text,
	"major" text,
	"minor" text,
	"expected_graduation" text,
	"research_interests" text,
	"skills" text,
	"achievements" text,
	"projects" text,
	"work_experience" text,
	"extracurricular" text,
	"career_goals" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_recommendation_letter_student_id" ON "recommendation_letter" ("student_id");--> statement-breakpoint
CREATE INDEX "idx_recommendation_letter_status" ON "recommendation_letter" ("status");--> statement-breakpoint
CREATE INDEX "idx_recommendation_letter_created_at" ON "recommendation_letter" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_recommendation_letter_template_id" ON "recommendation_letter" ("template_id");--> statement-breakpoint
CREATE INDEX "idx_recommendation_template_category" ON "recommendation_template" ("category");--> statement-breakpoint
CREATE INDEX "idx_recommendation_template_program_type" ON "recommendation_template" ("target_program_type");--> statement-breakpoint
CREATE INDEX "idx_recommendation_template_region" ON "recommendation_template" ("target_region");--> statement-breakpoint
CREATE INDEX "idx_recommendation_template_active" ON "recommendation_template" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_recommendation_template_composite" ON "recommendation_template" ("category","target_program_type","target_region");--> statement-breakpoint
CREATE INDEX "idx_student_profile_data_user_id" ON "student_profile_data" ("user_id");--> statement-breakpoint
ALTER TABLE "recommendation_letter" ADD CONSTRAINT "recommendation_letter_student_id_user_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recommendation_letter" ADD CONSTRAINT "recommendation_letter_MEodNtK0EIfW_fkey" FOREIGN KEY ("template_id") REFERENCES "recommendation_template"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recommendation_template" ADD CONSTRAINT "recommendation_template_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "recommendation_template" ADD CONSTRAINT "recommendation_template_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "student_profile_data" ADD CONSTRAINT "student_profile_data_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;