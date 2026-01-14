CREATE TABLE "saved_recommender" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"institution" text NOT NULL,
	"department" text,
	"email" text,
	"phone" text,
	"relationship" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"is_active" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_target_institution" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"institution" text NOT NULL,
	"program" text,
	"department" text,
	"country" text NOT NULL,
	"purpose" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"is_active" boolean NOT NULL
);
--> statement-breakpoint
CREATE INDEX "saved_recommender_user_id_idx" ON "saved_recommender" ("user_id");--> statement-breakpoint
CREATE INDEX "saved_recommender_name_idx" ON "saved_recommender" ("name");--> statement-breakpoint
CREATE INDEX "saved_target_institution_user_id_idx" ON "saved_target_institution" ("user_id");--> statement-breakpoint
CREATE INDEX "saved_target_institution_institution_idx" ON "saved_target_institution" ("institution");--> statement-breakpoint
ALTER TABLE "saved_recommender" ADD CONSTRAINT "saved_recommender_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_target_institution" ADD CONSTRAINT "saved_target_institution_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;