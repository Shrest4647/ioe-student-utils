CREATE TABLE "course_topic" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"unit_id" text NOT NULL,
	"parent_topic_id" text,
	"name" text NOT NULL,
	"description" text,
	"priority_level" text NOT NULL,
	"hours" integer DEFAULT 0 NOT NULL,
	"weightage" numeric(5,2),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_external_reference" boolean DEFAULT false NOT NULL,
	"external_topic_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "course_topic" ADD CONSTRAINT "course_topic_unit_id_course_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "course_unit"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "course_topic" ADD CONSTRAINT "course_topic_parent_topic_id_course_topic_id_fkey" FOREIGN KEY ("parent_topic_id") REFERENCES "course_topic"("id") ON DELETE SET NULL;