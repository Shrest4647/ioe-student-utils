CREATE TABLE "academic_course" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"code" text NOT NULL UNIQUE,
	"description" text,
	"credits" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "academic_program" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"code" text NOT NULL UNIQUE,
	"description" text,
	"credits" text,
	"degree_levels" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collegedepartmentprogramcourse_to_rating" (
	"college_department_program_course_id" text NOT NULL,
	"rating_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collegeprogram_to_course" (
	"id" text PRIMARY KEY,
	"college_program_id" text NOT NULL,
	"course_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collegedepartmentprogram_to_rating" (
	"college_department_program_id" text NOT NULL,
	"rating_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collegedepartment_to_program" (
	"id" text PRIMARY KEY,
	"college_department_id" text NOT NULL,
	"program_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "college_department" ADD CONSTRAINT "college_department_college_id_department_id_unique" UNIQUE("college_id","department_id");--> statement-breakpoint
ALTER TABLE "collegedepartmentprogramcourse_to_rating" ADD CONSTRAINT "collegedepartmentprogramcourse_to_rating_Mc4St3ycIHj6_fkey" FOREIGN KEY ("college_department_program_course_id") REFERENCES "collegeprogram_to_course"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegedepartmentprogramcourse_to_rating" ADD CONSTRAINT "collegedepartmentprogramcourse_to_rating_v6LlQcd8mO84_fkey" FOREIGN KEY ("rating_id") REFERENCES "rating"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegeprogram_to_course" ADD CONSTRAINT "collegeprogram_to_course_CxnIyJAK9KhN_fkey" FOREIGN KEY ("college_program_id") REFERENCES "collegedepartment_to_program"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegeprogram_to_course" ADD CONSTRAINT "collegeprogram_to_course_course_id_academic_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academic_course"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegedepartmentprogram_to_rating" ADD CONSTRAINT "collegedepartmentprogram_to_rating_vMlFMFlDT1Fs_fkey" FOREIGN KEY ("college_department_program_id") REFERENCES "collegedepartment_to_program"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegedepartmentprogram_to_rating" ADD CONSTRAINT "collegedepartmentprogram_to_rating_rating_id_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "rating"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegedepartment_to_program" ADD CONSTRAINT "collegedepartment_to_program_54GvlNMAZVvq_fkey" FOREIGN KEY ("college_department_id") REFERENCES "college_department"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collegedepartment_to_program" ADD CONSTRAINT "collegedepartment_to_program_rccbeBWqKSqC_fkey" FOREIGN KEY ("program_id") REFERENCES "academic_program"("id") ON DELETE CASCADE;