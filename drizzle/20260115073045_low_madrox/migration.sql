CREATE TABLE "api_key" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"start" text,
	"prefix" text,
	"key" text NOT NULL UNIQUE,
	"user_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_time_window" timestamp,
	"rate_limit_max" text,
	"request_count" text DEFAULT '0' NOT NULL,
	"last_request" timestamp,
	"remaining" text,
	"refill_interval" timestamp,
	"refill_amount" text,
	"last_refill_at" timestamp,
	"expires_at" timestamp,
	"permissions" jsonb,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;