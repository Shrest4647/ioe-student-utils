CREATE TABLE "gpa_conversion_range" (
	"id" text PRIMARY KEY,
	"standard_id" text NOT NULL,
	"min_percentage" text NOT NULL,
	"max_percentage" text NOT NULL,
	"gpa_value" text NOT NULL,
	"grade_label" text,
	"sort_order" text NOT NULL,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "gpa_conversion_standard" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "gpa_conversion" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"standard_id" text NOT NULL,
	"name" text,
	"cumulative_gpa" text NOT NULL,
	"total_credits" text NOT NULL,
	"total_quality_points" text NOT NULL,
	"course_count" text NOT NULL,
	"calculation_data" jsonb NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "gpa_range_standard_id_idx" ON "gpa_conversion_range" ("standard_id");--> statement-breakpoint
CREATE INDEX "gpa_range_sort_order_idx" ON "gpa_conversion_range" ("sort_order");--> statement-breakpoint
CREATE INDEX "gpa_standard_name_idx" ON "gpa_conversion_standard" ("name");--> statement-breakpoint
CREATE INDEX "gpa_standard_is_active_idx" ON "gpa_conversion_standard" ("is_active");--> statement-breakpoint
ALTER TABLE "gpa_conversion_range" ADD CONSTRAINT "gpa_conversion_range_L8PRyyxtW8H5_fkey" FOREIGN KEY ("standard_id") REFERENCES "gpa_conversion_standard"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gpa_conversion_range" ADD CONSTRAINT "gpa_conversion_range_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "gpa_conversion_range" ADD CONSTRAINT "gpa_conversion_range_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "gpa_conversion_standard" ADD CONSTRAINT "gpa_conversion_standard_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "gpa_conversion_standard" ADD CONSTRAINT "gpa_conversion_standard_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "gpa_conversion" ADD CONSTRAINT "gpa_conversion_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gpa_conversion" ADD CONSTRAINT "gpa_conversion_standard_id_gpa_conversion_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "gpa_conversion_standard"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recommendation_letter" DROP CONSTRAINT "recommendation_letter_MEodNtK0EIfW_fkey", ADD CONSTRAINT "recommendation_letter_MEodNtK0EIfW_fkey" FOREIGN KEY ("template_id") REFERENCES "recommendation_template"("id") ON DELETE SET NULL;