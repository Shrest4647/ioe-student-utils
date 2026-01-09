ALTER TABLE "country" ADD COLUMN "created_by_id" text;--> statement-breakpoint
ALTER TABLE "country" ADD COLUMN "updated_by_id" text;--> statement-breakpoint
ALTER TABLE "country" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "country" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "degree_level" ADD COLUMN "created_by_id" text;--> statement-breakpoint
ALTER TABLE "degree_level" ADD COLUMN "updated_by_id" text;--> statement-breakpoint
ALTER TABLE "degree_level" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "degree_level" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "field_of_study" ADD COLUMN "created_by_id" text;--> statement-breakpoint
ALTER TABLE "field_of_study" ADD COLUMN "updated_by_id" text;--> statement-breakpoint
ALTER TABLE "field_of_study" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "field_of_study" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "round_event" ADD COLUMN "created_by_id" text;--> statement-breakpoint
ALTER TABLE "round_event" ADD COLUMN "updated_by_id" text;--> statement-breakpoint
ALTER TABLE "round_event" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "round_event" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "scholarship_round" ADD COLUMN "created_by_id" text;--> statement-breakpoint
ALTER TABLE "scholarship_round" ADD COLUMN "updated_by_id" text;--> statement-breakpoint
ALTER TABLE "scholarship" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "scholarship" ADD COLUMN "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "scholarship" ADD COLUMN "created_by_id" text;--> statement-breakpoint
ALTER TABLE "scholarship" ADD COLUMN "updated_by_id" text;--> statement-breakpoint
ALTER TABLE "country" ADD CONSTRAINT "country_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "country" ADD CONSTRAINT "country_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "degree_level" ADD CONSTRAINT "degree_level_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "degree_level" ADD CONSTRAINT "degree_level_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "field_of_study" ADD CONSTRAINT "field_of_study_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "field_of_study" ADD CONSTRAINT "field_of_study_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "round_event" ADD CONSTRAINT "round_event_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "round_event" ADD CONSTRAINT "round_event_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "scholarship_round" ADD CONSTRAINT "scholarship_round_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "scholarship_round" ADD CONSTRAINT "scholarship_round_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "scholarship" ADD CONSTRAINT "scholarship_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "scholarship" ADD CONSTRAINT "scholarship_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");