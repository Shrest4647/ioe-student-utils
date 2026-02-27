CREATE TABLE "course_unit" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"course_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"unit_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "course_unit" ADD CONSTRAINT "course_unit_course_id_academic_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academic_course"("id") ON DELETE CASCADE;