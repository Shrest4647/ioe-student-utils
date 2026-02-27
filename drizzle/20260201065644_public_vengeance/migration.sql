CREATE TABLE "topic_prerequisite" (
	"id" text PRIMARY KEY,
	"topic_id" text NOT NULL,
	"prerequisite_topic_id" text NOT NULL,
	"dependency_type" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "unit_prerequisite" (
	"id" text PRIMARY KEY,
	"unit_id" text NOT NULL,
	"prerequisite_unit_id" text NOT NULL,
	"dependency_type" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "topic_prerequisite" ADD CONSTRAINT "topic_prerequisite_topic_id_course_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "course_topic"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "topic_prerequisite" ADD CONSTRAINT "topic_prerequisite_prerequisite_topic_id_course_topic_id_fkey" FOREIGN KEY ("prerequisite_topic_id") REFERENCES "course_topic"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "unit_prerequisite" ADD CONSTRAINT "unit_prerequisite_unit_id_course_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "course_unit"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "unit_prerequisite" ADD CONSTRAINT "unit_prerequisite_prerequisite_unit_id_course_unit_id_fkey" FOREIGN KEY ("prerequisite_unit_id") REFERENCES "course_unit"("id") ON DELETE CASCADE;