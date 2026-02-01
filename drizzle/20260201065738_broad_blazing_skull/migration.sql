CREATE TABLE "resource_tag" (
	"id" text PRIMARY KEY,
	"resource_id" text NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "topic_resource_link" (
	"id" text PRIMARY KEY,
	"topic_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"relevance" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "resource" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_tag" ADD CONSTRAINT "resource_tag_resource_id_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resource"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "topic_resource_link" ADD CONSTRAINT "topic_resource_link_topic_id_course_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "course_topic"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "topic_resource_link" ADD CONSTRAINT "topic_resource_link_resource_id_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resource"("id") ON DELETE CASCADE;