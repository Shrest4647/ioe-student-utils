CREATE TABLE "agent_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text,
	"client_id" text,
	"api_key_id" text,
	"agent_name" text,
	"agent_version" text,
	"server_name" text NOT NULL,
	"server_version" text NOT NULL,
	"environment" text NOT NULL,
	"kind" text NOT NULL,
	"impact" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"task" text NOT NULL,
	"description" text NOT NULL,
	"operation" text,
	"error" text,
	"suggestion" text,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "agent_feedback_created_idx" ON "agent_feedback" ("created_at");--> statement-breakpoint
CREATE INDEX "agent_feedback_user_created_idx" ON "agent_feedback" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_feedback_status_created_idx" ON "agent_feedback" ("status","created_at");--> statement-breakpoint
CREATE INDEX "agent_feedback_fingerprint_idx" ON "agent_feedback" ("fingerprint");--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;