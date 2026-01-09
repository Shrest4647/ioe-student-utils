CREATE TABLE "country" (
	"code" text PRIMARY KEY,
	"name" text NOT NULL,
	"region" text
);
--> statement-breakpoint
CREATE TABLE "degree_level" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"rank" text
);
--> statement-breakpoint
CREATE TABLE "field_of_study" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "round_event" (
	"id" text PRIMARY KEY,
	"round_id" text NOT NULL,
	"name" text NOT NULL,
	"date" timestamp NOT NULL,
	"type" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "scholarship_round" (
	"id" text PRIMARY KEY,
	"scholarship_id" text NOT NULL,
	"round_name" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"open_date" timestamp,
	"deadline_date" timestamp,
	"scholarship_amount" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"provider_name" text,
	"website_url" text,
	"funding_type" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship_to_country" (
	"scholarship_id" text NOT NULL,
	"country_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship_to_degree" (
	"scholarship_id" text NOT NULL,
	"degree_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship_to_field" (
	"scholarship_id" text NOT NULL,
	"field_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_application" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"round_id" text NOT NULL,
	"status" text DEFAULT 'saved',
	"personal_notes" text,
	"deadline_reminder" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "round_event" ADD CONSTRAINT "round_event_round_id_scholarship_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "scholarship_round"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scholarship_round" ADD CONSTRAINT "scholarship_round_scholarship_id_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarship"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scholarship_to_country" ADD CONSTRAINT "scholarship_to_country_scholarship_id_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarship"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scholarship_to_country" ADD CONSTRAINT "scholarship_to_country_country_code_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "country"("code") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scholarship_to_degree" ADD CONSTRAINT "scholarship_to_degree_scholarship_id_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarship"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scholarship_to_degree" ADD CONSTRAINT "scholarship_to_degree_degree_id_degree_level_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "degree_level"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scholarship_to_field" ADD CONSTRAINT "scholarship_to_field_scholarship_id_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarship"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scholarship_to_field" ADD CONSTRAINT "scholarship_to_field_field_id_field_of_study_id_fkey" FOREIGN KEY ("field_id") REFERENCES "field_of_study"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_application" ADD CONSTRAINT "user_application_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_application" ADD CONSTRAINT "user_application_round_id_scholarship_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "scholarship_round"("id") ON DELETE CASCADE;