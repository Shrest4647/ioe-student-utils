CREATE TABLE "college_department" (
	"id" text PRIMARY KEY,
	"college_id" text NOT NULL,
	"department_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collegedepartment_to_rating" (
	"college_department_id" text NOT NULL,
	"rating_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_to_rating" (
	"college_id" text NOT NULL,
	"rating_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rating" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"rating" text NOT NULL,
	"review" text,
	"rating_category_id" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "university_to_rating" (
	"university_id" text NOT NULL,
	"rating_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "department" DROP CONSTRAINT "department_college_id_college_id_fkey";--> statement-breakpoint
DROP TABLE "college_rating_constraint";--> statement-breakpoint
DROP TABLE "college_rating";--> statement-breakpoint
DROP TABLE "department_rating_constraint";--> statement-breakpoint
DROP TABLE "department_rating";--> statement-breakpoint
DROP TABLE "university_rating_constraint";--> statement-breakpoint
DROP TABLE "university_rating";--> statement-breakpoint
ALTER TABLE "rating_category" DROP CONSTRAINT "rating_category_name_key";--> statement-breakpoint
ALTER TABLE "college" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "rating_category" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "rating_category" DROP COLUMN "entity_type";--> statement-breakpoint
ALTER TABLE "rating_category" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "department" DROP COLUMN "college_id";--> statement-breakpoint
ALTER TABLE "rating_category" ADD CONSTRAINT "rating_category_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "college_department" ADD CONSTRAINT "college_department_college_id_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college_department" ADD CONSTRAINT "college_department_department_id_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegedepartment_to_rating" ADD CONSTRAINT "collegedepartment_to_rating_HPHTMJfoRJgV_fkey" FOREIGN KEY ("college_department_id") REFERENCES "college_department"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegedepartment_to_rating" ADD CONSTRAINT "collegedepartment_to_rating_rating_id_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "rating"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college_to_rating" ADD CONSTRAINT "college_to_rating_college_id_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college_to_rating" ADD CONSTRAINT "college_to_rating_rating_id_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "rating"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_rating_category_id_rating_category_id_fkey" FOREIGN KEY ("rating_category_id") REFERENCES "rating_category"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "university_to_rating" ADD CONSTRAINT "university_to_rating_university_id_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "university_to_rating" ADD CONSTRAINT "university_to_rating_rating_id_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "rating"("id") ON DELETE CASCADE;