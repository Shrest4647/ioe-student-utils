CREATE TABLE "flashcard_user_deck_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"deck_id" uuid NOT NULL,
	"study_mode" text DEFAULT 'adaptive' NOT NULL,
	"scheduling_aggressiveness" text DEFAULT 'balanced' NOT NULL,
	"confidence_scale" integer DEFAULT 4 NOT NULL,
	"new_cards_per_day" integer,
	"max_reviews_per_day" integer,
	"auto_advance" boolean DEFAULT true NOT NULL,
	"show_hints" boolean DEFAULT true NOT NULL,
	"appearance" text DEFAULT 'comfortable' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "flashcard_user_deck_preferences_user_deck_unique" UNIQUE("user_id","deck_id")
);
--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD COLUMN "client_review_id" varchar(255);--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD COLUMN "confidence" integer;--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD COLUMN "study_mode" text DEFAULT 'adaptive' NOT NULL;--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_client_review_id_key" UNIQUE("client_review_id");--> statement-breakpoint
CREATE INDEX "flashcard_reviews_client_review_id_idx" ON "flashcard_reviews" ("client_review_id");--> statement-breakpoint
CREATE INDEX "flashcard_user_deck_preferences_user_idx" ON "flashcard_user_deck_preferences" ("user_id");--> statement-breakpoint
CREATE INDEX "flashcard_user_deck_preferences_deck_idx" ON "flashcard_user_deck_preferences" ("deck_id");--> statement-breakpoint
ALTER TABLE "flashcard_user_deck_preferences" ADD CONSTRAINT "flashcard_user_deck_preferences_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "flashcard_user_deck_preferences" ADD CONSTRAINT "flashcard_user_deck_preferences_deck_id_flashcard_decks_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE;