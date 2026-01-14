CREATE TABLE "saved_template_variables" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"template_id" text NOT NULL,
	"name" text NOT NULL,
	"variables" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"is_active" boolean NOT NULL
);
--> statement-breakpoint
CREATE INDEX "saved_template_variables_user_id_idx" ON "saved_template_variables" ("user_id");--> statement-breakpoint
CREATE INDEX "saved_template_variables_template_id_idx" ON "saved_template_variables" ("template_id");--> statement-breakpoint
CREATE INDEX "saved_template_variables_name_idx" ON "saved_template_variables" ("name");--> statement-breakpoint
ALTER TABLE "saved_template_variables" ADD CONSTRAINT "saved_template_variables_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_template_variables" ADD CONSTRAINT "saved_template_variables_9snkaZYc0TRI_fkey" FOREIGN KEY ("template_id") REFERENCES "recommendation_template"("id") ON DELETE CASCADE;