ALTER TABLE "user" ADD COLUMN "is_anonymous" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "two_factor_enabled" boolean NOT NULL;