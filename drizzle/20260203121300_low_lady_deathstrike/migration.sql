ALTER TABLE "academic_course" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "academic_course"
SET "slug" = CONCAT(
	COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("code"), '[^a-z0-9]+', '-', 'g')), ''), 'course'),
	'-',
	LEFT(MD5("id"), 8)
);--> statement-breakpoint
ALTER TABLE "academic_course" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_course" ADD CONSTRAINT "academic_course_slug_key" UNIQUE("slug");
