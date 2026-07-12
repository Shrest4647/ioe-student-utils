CREATE TABLE "flashcard_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"deck_id" uuid NOT NULL,
	"order_no" integer NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"hint" text,
	"explanation" text,
	"media" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "flashcard_cards_deck_order_unique" UNIQUE("deck_id","order_no")
);
--> statement-breakpoint
CREATE TABLE "flashcard_deck_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"deck_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "flashcard_deck_tags_deck_tag_unique" UNIQUE("deck_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "flashcard_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(255) NOT NULL UNIQUE,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"difficulty" text,
	"estimated_minutes" integer,
	"language" varchar(16),
	"srs_algorithm" text DEFAULT 'sm2' NOT NULL,
	"new_cards_per_day" integer DEFAULT 20 NOT NULL,
	"max_reviews_per_day" integer DEFAULT 200 NOT NULL,
	"learning_steps" jsonb DEFAULT '[1,10]' NOT NULL,
	"graduating_interval_days" integer DEFAULT 1 NOT NULL,
	"easy_interval_days" integer DEFAULT 4 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by_id" text NOT NULL,
	"updated_by_id" text,
	"published_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"deck_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" text,
	"rating" text NOT NULL,
	"response_ms" integer,
	"was_recalled" boolean NOT NULL,
	"reviewed_at" timestamp NOT NULL,
	"scheduled_due_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "flashcard_study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"deck_id" uuid NOT NULL,
	"user_id" text,
	"guest_session_id" varchar(255),
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"cards_studied" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"accuracy_percentage" integer DEFAULT 0 NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(80) NOT NULL UNIQUE,
	"slug" varchar(120) NOT NULL UNIQUE,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_user_card_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"deck_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"state" text DEFAULT 'new' NOT NULL,
	"due_at" timestamp NOT NULL,
	"stability" real DEFAULT 0 NOT NULL,
	"difficulty" real DEFAULT 0 NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetition" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"last_reviewed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "flashcard_user_card_states_user_card_unique" UNIQUE("user_id","card_id")
);
--> statement-breakpoint
CREATE INDEX "flashcard_cards_deck_id_idx" ON "flashcard_cards" ("deck_id");--> statement-breakpoint
CREATE INDEX "flashcard_cards_active_idx" ON "flashcard_cards" ("is_active");--> statement-breakpoint
CREATE INDEX "flashcard_deck_tags_deck_id_idx" ON "flashcard_deck_tags" ("deck_id");--> statement-breakpoint
CREATE INDEX "flashcard_deck_tags_tag_id_idx" ON "flashcard_deck_tags" ("tag_id");--> statement-breakpoint
CREATE INDEX "flashcard_decks_slug_idx" ON "flashcard_decks" ("slug");--> statement-breakpoint
CREATE INDEX "flashcard_decks_status_idx" ON "flashcard_decks" ("status");--> statement-breakpoint
CREATE INDEX "flashcard_decks_created_by_idx" ON "flashcard_decks" ("created_by_id");--> statement-breakpoint
CREATE INDEX "flashcard_decks_published_at_idx" ON "flashcard_decks" ("published_at");--> statement-breakpoint
CREATE INDEX "flashcard_reviews_session_id_idx" ON "flashcard_reviews" ("session_id");--> statement-breakpoint
CREATE INDEX "flashcard_reviews_card_id_idx" ON "flashcard_reviews" ("card_id");--> statement-breakpoint
CREATE INDEX "flashcard_reviews_user_id_idx" ON "flashcard_reviews" ("user_id");--> statement-breakpoint
CREATE INDEX "flashcard_reviews_reviewed_at_idx" ON "flashcard_reviews" ("reviewed_at");--> statement-breakpoint
CREATE INDEX "flashcard_reviews_deck_id_idx" ON "flashcard_reviews" ("deck_id");--> statement-breakpoint
CREATE INDEX "flashcard_study_sessions_deck_id_idx" ON "flashcard_study_sessions" ("deck_id");--> statement-breakpoint
CREATE INDEX "flashcard_study_sessions_user_id_idx" ON "flashcard_study_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "flashcard_study_sessions_status_idx" ON "flashcard_study_sessions" ("status");--> statement-breakpoint
CREATE INDEX "flashcard_study_sessions_started_at_idx" ON "flashcard_study_sessions" ("started_at");--> statement-breakpoint
CREATE INDEX "flashcard_tags_slug_idx" ON "flashcard_tags" ("slug");--> statement-breakpoint
CREATE INDEX "flashcard_user_card_states_user_due_idx" ON "flashcard_user_card_states" ("user_id","due_at");--> statement-breakpoint
CREATE INDEX "flashcard_user_card_states_user_deck_idx" ON "flashcard_user_card_states" ("user_id","deck_id");--> statement-breakpoint
ALTER TABLE "flashcard_cards" ADD CONSTRAINT "flashcard_cards_deck_id_flashcard_decks_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_deck_tags" ADD CONSTRAINT "flashcard_deck_tags_deck_id_flashcard_decks_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_deck_tags" ADD CONSTRAINT "flashcard_deck_tags_tag_id_flashcard_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "flashcard_tags"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_session_id_flashcard_study_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "flashcard_study_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_deck_id_flashcard_decks_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_card_id_flashcard_cards_id_fkey" FOREIGN KEY ("card_id") REFERENCES "flashcard_cards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "flashcard_study_sessions" ADD CONSTRAINT "flashcard_study_sessions_deck_id_flashcard_decks_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_study_sessions" ADD CONSTRAINT "flashcard_study_sessions_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "flashcard_user_card_states" ADD CONSTRAINT "flashcard_user_card_states_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_user_card_states" ADD CONSTRAINT "flashcard_user_card_states_deck_id_flashcard_decks_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_user_card_states" ADD CONSTRAINT "flashcard_user_card_states_card_id_flashcard_cards_id_fkey" FOREIGN KEY ("card_id") REFERENCES "flashcard_cards"("id") ON DELETE CASCADE;