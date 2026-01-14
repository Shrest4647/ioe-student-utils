ALTER TABLE "rating_category" ADD COLUMN "applicable_entity_type" text DEFAULT 'all';--> statement-breakpoint
ALTER TABLE "rating_category" ADD COLUMN "sort_order" text;--> statement-breakpoint
CREATE INDEX "idx_collegedeptprogcpc_rating_college_department_program_course_id" ON "collegedepartmentprogramcourse_to_rating" ("college_department_program_course_id");--> statement-breakpoint
CREATE INDEX "idx_collegedeptprogcpc_rating_rating_id" ON "collegedepartmentprogramcourse_to_rating" ("rating_id");--> statement-breakpoint
CREATE INDEX "idx_collegedeptprog_rating_college_department_program_id" ON "collegedepartmentprogram_to_rating" ("college_department_program_id");--> statement-breakpoint
CREATE INDEX "idx_collegedeptprog_rating_rating_id" ON "collegedepartmentprogram_to_rating" ("rating_id");--> statement-breakpoint
CREATE INDEX "idx_collegedept_rating_college_department_id" ON "collegedepartment_to_rating" ("college_department_id");--> statement-breakpoint
CREATE INDEX "idx_collegedept_rating_rating_id" ON "collegedepartment_to_rating" ("rating_id");--> statement-breakpoint
CREATE INDEX "idx_college_rating_college_id" ON "college_to_rating" ("college_id");--> statement-breakpoint
CREATE INDEX "idx_college_rating_rating_id" ON "college_to_rating" ("rating_id");--> statement-breakpoint
CREATE INDEX "idx_rating_category_id" ON "rating" ("rating_category_id");--> statement-breakpoint
CREATE INDEX "idx_university_rating_university_id" ON "university_to_rating" ("university_id");--> statement-breakpoint
CREATE INDEX "idx_university_rating_rating_id" ON "university_to_rating" ("rating_id");