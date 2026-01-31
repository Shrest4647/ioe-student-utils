CREATE TABLE "academic_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"subject_name" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"event_time" time,
	"location" varchar(255),
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"task_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"minutes_spent" integer NOT NULL,
	"notes" text,
	"logged_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"template_id" uuid,
	"subject_name" varchar(255) NOT NULL,
	"exam_date" date NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"daily_tasks" jsonb NOT NULL,
	"progress_percentage" numeric(5,2),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"study_plan_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"task_type" varchar(50) NOT NULL,
	"estimated_minutes" integer,
	"completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"actual_minutes_spent" integer,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"duration_days" integer NOT NULL,
	"difficulty_level" varchar(50),
	"daily_structure" jsonb NOT NULL,
	"intensity_curve" jsonb NOT NULL,
	"subject_area" varchar(100),
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "academic_event_user_id_idx" ON "academic_event" ("user_id");--> statement-breakpoint
CREATE INDEX "academic_event_date_idx" ON "academic_event" ("event_date");--> statement-breakpoint
CREATE INDEX "study_logs_task_id_idx" ON "study_logs" ("task_id");--> statement-breakpoint
CREATE INDEX "study_logs_user_id_idx" ON "study_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "study_plans_user_id_idx" ON "study_plans" ("user_id");--> statement-breakpoint
CREATE INDEX "study_plans_status_idx" ON "study_plans" ("status");--> statement-breakpoint
CREATE INDEX "study_plans_exam_date_idx" ON "study_plans" ("exam_date");--> statement-breakpoint
CREATE INDEX "study_tasks_study_plan_id_idx" ON "study_tasks" ("study_plan_id");--> statement-breakpoint
CREATE INDEX "study_tasks_completed_idx" ON "study_tasks" ("completed");--> statement-breakpoint
CREATE INDEX "study_tasks_day_number_idx" ON "study_tasks" ("day_number");--> statement-breakpoint
CREATE INDEX "study_templates_subject_area_idx" ON "study_templates" ("subject_area");--> statement-breakpoint
CREATE INDEX "study_templates_difficulty_idx" ON "study_templates" ("difficulty_level");--> statement-breakpoint
ALTER TABLE "academic_event" ADD CONSTRAINT "academic_event_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "study_logs" ADD CONSTRAINT "study_logs_task_id_study_tasks_id_fkey" FOREIGN KEY ("task_id") REFERENCES "study_tasks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "study_logs" ADD CONSTRAINT "study_logs_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_template_id_study_templates_id_fkey" FOREIGN KEY ("template_id") REFERENCES "study_templates"("id");--> statement-breakpoint
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_study_plan_id_study_plans_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE;