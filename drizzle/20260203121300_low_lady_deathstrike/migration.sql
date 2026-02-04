ALTER TABLE "academic_course" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_course" ADD CONSTRAINT "academic_course_slug_key" UNIQUE("slug");