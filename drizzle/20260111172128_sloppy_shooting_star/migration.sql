ALTER TABLE "collegeprogram_to_course" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "collegeprogram_to_course" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "collegeprogram_to_course" ADD COLUMN "credits" text;--> statement-breakpoint
ALTER TABLE "collegeprogram_to_course" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "college_department" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "college_department" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "college_department" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "collegedepartment_to_program" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "collegedepartment_to_program" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "collegedepartment_to_program" ADD COLUMN "credits" text;--> statement-breakpoint
ALTER TABLE "collegedepartment_to_program" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "rating_category" DROP COLUMN "applicable_entity_type";