CREATE TABLE "college_rating_constraint" (
	"user_id" text NOT NULL,
	"college_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_rating" (
	"id" text PRIMARY KEY,
	"college_id" text NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text NOT NULL,
	"rating" text NOT NULL,
	"review" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "college" (
	"id" text PRIMARY KEY,
	"university_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"website_url" text,
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "department_rating_constraint" (
	"user_id" text NOT NULL,
	"department_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_rating" (
	"id" text PRIMARY KEY,
	"department_id" text NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text NOT NULL,
	"rating" text NOT NULL,
	"review" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "department" (
	"id" text PRIMARY KEY,
	"college_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"website_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rating_category" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"entity_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" text DEFAULT '0',
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "university" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"website_url" text,
	"logo_url" text,
	"established_year" text,
	"location" text,
	"country" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "university_rating_constraint" (
	"user_id" text NOT NULL,
	"university_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "university_rating" (
	"id" text PRIMARY KEY,
	"university_id" text NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text NOT NULL,
	"rating" text NOT NULL,
	"review" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "college_rating_constraint" ADD CONSTRAINT "college_rating_constraint_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college_rating_constraint" ADD CONSTRAINT "college_rating_constraint_college_id_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college_rating" ADD CONSTRAINT "college_rating_college_id_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college_rating" ADD CONSTRAINT "college_rating_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college_rating" ADD CONSTRAINT "college_rating_category_id_rating_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "rating_category"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college" ADD CONSTRAINT "college_university_id_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "college" ADD CONSTRAINT "college_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "college" ADD CONSTRAINT "college_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "department_rating_constraint" ADD CONSTRAINT "department_rating_constraint_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "department_rating_constraint" ADD CONSTRAINT "department_rating_constraint_department_id_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "department_rating" ADD CONSTRAINT "department_rating_department_id_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "department_rating" ADD CONSTRAINT "department_rating_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "department_rating" ADD CONSTRAINT "department_rating_category_id_rating_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "rating_category"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_college_id_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "rating_category" ADD CONSTRAINT "rating_category_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "rating_category" ADD CONSTRAINT "rating_category_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "university" ADD CONSTRAINT "university_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "university" ADD CONSTRAINT "university_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "university_rating_constraint" ADD CONSTRAINT "university_rating_constraint_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "university_rating_constraint" ADD CONSTRAINT "university_rating_constraint_university_id_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "university_rating" ADD CONSTRAINT "university_rating_university_id_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "university_rating" ADD CONSTRAINT "university_rating_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "university_rating" ADD CONSTRAINT "university_rating_category_id_rating_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "rating_category"("id") ON DELETE CASCADE;