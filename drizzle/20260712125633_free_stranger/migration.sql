CREATE TABLE "academic_course_slug_alias" (
	"id" text PRIMARY KEY,
	"course_id" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"created_at" timestamp
);
--> statement-breakpoint
INSERT INTO "academic_course_slug_alias" ("id", "course_id", "slug", "created_at")
SELECT
	'legacy-' || MD5("id" || ':' || "slug"),
	"id",
	"slug",
	NOW()
FROM "academic_course"
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
WITH canonical_candidates AS (
	SELECT
		"id",
		TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("code"), '[^a-z0-9]+', '-', 'g')) AS "canonical_slug"
	FROM "academic_course"
)
UPDATE "academic_course" AS course
SET "slug" = candidate."canonical_slug"
FROM canonical_candidates AS candidate
WHERE course."id" = candidate."id"
	AND candidate."canonical_slug" <> ''
	AND course."slug" <> candidate."canonical_slug"
	AND (
		SELECT COUNT(*)
		FROM canonical_candidates AS same_candidate
		WHERE same_candidate."canonical_slug" = candidate."canonical_slug"
	) = 1
	AND NOT EXISTS (
		SELECT 1
		FROM "academic_course" AS conflicting_course
		WHERE conflicting_course."id" <> course."id"
			AND conflicting_course."slug" = candidate."canonical_slug"
	)
	AND NOT EXISTS (
		SELECT 1
		FROM "academic_course_slug_alias" AS conflicting_alias
		WHERE conflicting_alias."course_id" <> course."id"
			AND conflicting_alias."slug" = candidate."canonical_slug"
	);
--> statement-breakpoint
CREATE TABLE "study_plan_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"study_plan_id" uuid NOT NULL,
	"course_topic_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"included" boolean DEFAULT true NOT NULL,
	"selection_reason" varchar(100),
	"estimated_minutes" integer,
	"mastery_status" varchar(50) DEFAULT 'not-started' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_plans" DROP CONSTRAINT "study_plans_slug_key";--> statement-breakpoint
ALTER TABLE "collegeprogram_to_course" ADD COLUMN "year_number" smallint;--> statement-breakpoint
ALTER TABLE "collegeprogram_to_course" ADD COLUMN "part_number" smallint;--> statement-breakpoint
ALTER TABLE "collegeprogram_to_course" ADD COLUMN "course_type" text;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "course_id" text;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "academic_event_id" uuid;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "goal" varchar(50);--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "daily_minutes" integer;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "availability" jsonb;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "schedule_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "generation_input" jsonb;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "last_rebalanced_at" timestamp;--> statement-breakpoint
ALTER TABLE "study_tasks" ADD COLUMN "slug" varchar(160);--> statement-breakpoint
ALTER TABLE "study_tasks" ADD COLUMN "course_topic_id" text;--> statement-breakpoint
ALTER TABLE "study_tasks" ADD COLUMN "scheduled_date" date;--> statement-breakpoint
ALTER TABLE "study_tasks" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "study_tasks" ADD COLUMN "origin" varchar(50);--> statement-breakpoint
ALTER TABLE "study_tasks" ADD COLUMN "available_after" timestamp;--> statement-breakpoint
ALTER TABLE "study_templates" ADD COLUMN "slug" varchar(120);--> statement-breakpoint
ALTER TABLE "study_templates" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "study_templates" ADD COLUMN "planning_mode" varchar(50);--> statement-breakpoint
ALTER TABLE "study_templates" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
WITH template_slug_parts AS (
	SELECT
		"id",
		COALESCE(
			NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g')), ''),
			'study-template'
		) AS "base_slug",
		ROW_NUMBER() OVER (
			PARTITION BY COALESCE(
				NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g')), ''),
				'study-template'
			)
			ORDER BY "id"
		) AS "slug_position"
	FROM "study_templates"
),
template_slugs AS (
	SELECT
		"id",
		CASE
			WHEN "slug_position" = 1 THEN LEFT("base_slug", 120)
			ELSE LEFT("base_slug", 119 - LENGTH("slug_position"::text)) || '-' || "slug_position"
		END AS "slug"
	FROM template_slug_parts
)
UPDATE "study_templates" AS template
SET "slug" = source."slug"
FROM template_slugs AS source
WHERE template."id" = source."id" AND template."slug" IS NULL;--> statement-breakpoint
UPDATE "study_tasks" AS task
SET "scheduled_date" = plan."start_date" + (task."day_number" - 1)
FROM "study_plans" AS plan
WHERE task."study_plan_id" = plan."id" AND task."scheduled_date" IS NULL;--> statement-breakpoint
WITH task_slug_parts AS (
	SELECT
		"id",
		COALESCE(
			NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("title"), '[^a-z0-9]+', '-', 'g')), ''),
			'task'
		) AS "base_slug",
		"day_number",
		ROW_NUMBER() OVER (
			PARTITION BY "study_plan_id"
			ORDER BY "day_number", "created_at", "id"
		) AS "row_num"
	FROM "study_tasks"
),
task_slugs AS (
	SELECT
		"id",
		LEFT("base_slug", 158 - LENGTH("day_number"::text) - LENGTH("row_num"::text)) || '-' || "day_number" || '-' || "row_num" AS "task_slug"
	FROM task_slug_parts
)
UPDATE "study_tasks" AS task
SET "slug" = source."task_slug"
FROM task_slugs AS source
WHERE task."id" = source."id" AND task."slug" IS NULL;--> statement-breakpoint
ALTER TABLE "study_templates" ADD CONSTRAINT "study_templates_slug_key" UNIQUE("slug");--> statement-breakpoint
CREATE INDEX "idx_course_slug_alias_course_id" ON "academic_course_slug_alias" ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "study_plan_topics_plan_topic_idx" ON "study_plan_topics" ("study_plan_id","course_topic_id");--> statement-breakpoint
CREATE INDEX "study_plan_topics_plan_id_idx" ON "study_plan_topics" ("study_plan_id");--> statement-breakpoint
CREATE INDEX "study_plan_topics_topic_id_idx" ON "study_plan_topics" ("course_topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "study_plans_user_slug_idx" ON "study_plans" ("user_id","slug");--> statement-breakpoint
CREATE INDEX "study_plans_course_id_idx" ON "study_plans" ("course_id");--> statement-breakpoint
CREATE INDEX "study_tasks_scheduled_date_idx" ON "study_tasks" ("scheduled_date");--> statement-breakpoint
CREATE INDEX "study_tasks_topic_id_idx" ON "study_tasks" ("course_topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "study_tasks_plan_slug_idx" ON "study_tasks" ("study_plan_id","slug");--> statement-breakpoint
ALTER TABLE "academic_course_slug_alias" ADD CONSTRAINT "academic_course_slug_alias_course_id_academic_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academic_course"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "study_plan_topics" ADD CONSTRAINT "study_plan_topics_study_plan_id_study_plans_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "study_plan_topics" ADD CONSTRAINT "study_plan_topics_course_topic_id_course_topic_id_fkey" FOREIGN KEY ("course_topic_id") REFERENCES "course_topic"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_course_id_academic_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academic_course"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_academic_event_id_academic_event_id_fkey" FOREIGN KEY ("academic_event_id") REFERENCES "academic_event"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_course_topic_id_course_topic_id_fkey" FOREIGN KEY ("course_topic_id") REFERENCES "course_topic"("id") ON DELETE SET NULL;
