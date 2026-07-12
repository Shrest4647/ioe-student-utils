CREATE TABLE "quiz_attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option_ids" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"answered_at" timestamp NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "quiz_attempt_answers_attempt_question_unique" UNIQUE("attempt_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"quiz_id" uuid NOT NULL,
	"user_id" text,
	"guest_session_id" varchar(255),
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"score" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"percentage" integer DEFAULT 0 NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question_id" uuid NOT NULL,
	"order_no" integer NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"rationale" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "quiz_options_question_order_unique" UNIQUE("question_id","order_no")
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"quiz_id" uuid NOT NULL,
	"order_no" integer NOT NULL,
	"prompt" text NOT NULL,
	"hint" text,
	"rationale" text,
	"question_type" text DEFAULT 'single_choice' NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "quiz_questions_quiz_order_unique" UNIQUE("quiz_id","order_no")
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(255) NOT NULL UNIQUE,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"difficulty" text,
	"estimated_minutes" integer,
	"time_limit_seconds" integer,
	"pass_percentage" integer DEFAULT 60 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by_id" text NOT NULL,
	"updated_by_id" text,
	"published_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "quiz_attempt_answers_attempt_id_idx" ON "quiz_attempt_answers" ("attempt_id");--> statement-breakpoint
CREATE INDEX "quiz_attempt_answers_question_id_idx" ON "quiz_attempt_answers" ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts" ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts" ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_status_idx" ON "quiz_attempts" ("status");--> statement-breakpoint
CREATE INDEX "quiz_attempts_started_at_idx" ON "quiz_attempts" ("started_at");--> statement-breakpoint
CREATE INDEX "quiz_options_question_id_idx" ON "quiz_options" ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_quiz_id_idx" ON "quiz_questions" ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_active_idx" ON "quiz_questions" ("is_active");--> statement-breakpoint
CREATE INDEX "quizzes_slug_idx" ON "quizzes" ("slug");--> statement-breakpoint
CREATE INDEX "quizzes_status_idx" ON "quizzes" ("status");--> statement-breakpoint
CREATE INDEX "quizzes_created_by_idx" ON "quizzes" ("created_by_id");--> statement-breakpoint
CREATE INDEX "quizzes_published_at_idx" ON "quizzes" ("published_at");--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_quiz_attempts_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_quiz_questions_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_quiz_questions_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;