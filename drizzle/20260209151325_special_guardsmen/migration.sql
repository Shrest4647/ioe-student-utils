-- Add slug column as nullable first
ALTER TABLE "study_plans" ADD COLUMN "slug" varchar(255);--> statement-breakpoint

-- Generate slugs for existing records
UPDATE "study_plans" SET "slug" = LOWER(REGEXP_REPLACE(TRIM(subject_name), '[^\w\s-]', '', 'g')) WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "study_plans" SET "slug" = REGEXP_REPLACE("slug", '[\s_-]+', '-', 'g') WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "study_plans" SET "slug" = REGEXP_REPLACE("slug", '^-+|-+$', '') WHERE "slug" IS NULL;--> statement-breakpoint

-- Handle duplicate slugs by appending counter
DO $$
DECLARE
    plan_record RECORD;
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER;
BEGIN
    FOR plan_record IN
        SELECT id, "slug" FROM "study_plans" ORDER BY id
    LOOP
        base_slug := plan_record."slug";
        counter := 1;
        new_slug := base_slug;

        WHILE EXISTS (SELECT 1 FROM "study_plans" WHERE "slug" = new_slug AND id != plan_record.id) LOOP
            new_slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;

        UPDATE "study_plans" SET "slug" = new_slug WHERE id = plan_record.id;
    END LOOP;
END $$;--> statement-breakpoint

-- Now make the column NOT NULL and add constraints
ALTER TABLE "study_plans" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_slug_key" UNIQUE("slug");--> statement-breakpoint
CREATE INDEX "study_plans_slug_idx" ON "study_plans" ("slug");