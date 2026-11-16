CREATE TABLE "oauth_access_token" (
	"id" text PRIMARY KEY,
	"access_token" text NOT NULL UNIQUE,
	"refresh_token" text NOT NULL UNIQUE,
	"access_token_expires_at" timestamp NOT NULL,
	"refresh_token_expires_at" timestamp NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text,
	"scopes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_application" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"icon" text,
	"metadata" text,
	"client_id" text NOT NULL UNIQUE,
	"client_secret" text,
	"redirect_urls" text NOT NULL,
	"type" text DEFAULT 'web' NOT NULL,
	"disabled" boolean DEFAULT false,
	"user_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_consent" (
	"id" text PRIMARY KEY,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"scopes" text,
	"consent_given" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_clientId_idx" ON "oauth_access_token" ("client_id");--> statement-breakpoint
CREATE INDEX "oauthAccessToken_userId_idx" ON "oauth_access_token" ("user_id");--> statement-breakpoint
CREATE INDEX "oauthApplication_userId_idx" ON "oauth_application" ("user_id");--> statement-breakpoint
CREATE INDEX "oauthApplication_clientId_idx" ON "oauth_application" ("client_id");--> statement-breakpoint
CREATE INDEX "oauthConsent_clientId_idx" ON "oauth_consent" ("client_id");--> statement-breakpoint
CREATE INDEX "oauthConsent_userId_idx" ON "oauth_consent" ("user_id");--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_client_id_oauth_application_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_application"("client_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_application" ADD CONSTRAINT "oauth_application_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_client_id_oauth_application_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_application"("client_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;