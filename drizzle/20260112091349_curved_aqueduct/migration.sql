CREATE TABLE "course_to_rating" (
	"course_id" text NOT NULL,
	"rating_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_to_rating" (
	"department_id" text NOT NULL,
	"rating_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_to_rating" (
	"program_id" text NOT NULL,
	"rating_id" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_course_rating_course_id" ON "course_to_rating" ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_rating_rating_id" ON "course_to_rating" ("rating_id");--> statement-breakpoint
CREATE INDEX "idx_department_rating_department_id" ON "department_to_rating" ("department_id");--> statement-breakpoint
CREATE INDEX "idx_department_rating_rating_id" ON "department_to_rating" ("rating_id");--> statement-breakpoint
CREATE INDEX "idx_program_rating_program_id" ON "program_to_rating" ("program_id");--> statement-breakpoint
CREATE INDEX "idx_program_rating_rating_id" ON "program_to_rating" ("rating_id");--> statement-breakpoint
ALTER TABLE "course_to_rating" ADD CONSTRAINT "course_to_rating_course_id_academic_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academic_course"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "course_to_rating" ADD CONSTRAINT "course_to_rating_rating_id_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "rating"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "department_to_rating" ADD CONSTRAINT "department_to_rating_department_id_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "department_to_rating" ADD CONSTRAINT "department_to_rating_rating_id_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "rating"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "program_to_rating" ADD CONSTRAINT "program_to_rating_program_id_academic_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "academic_program"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "program_to_rating" ADD CONSTRAINT "program_to_rating_rating_id_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "rating"("id") ON DELETE CASCADE;