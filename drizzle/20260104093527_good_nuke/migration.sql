CREATE TABLE "resource_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "resource_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "resource_content_type" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "resource_content_type_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "resource" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"s3_url" text NOT NULL,
	"file_format" text NOT NULL,
	"content_type_id" text NOT NULL,
	"uploader_id" text NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_to_category" (
	"resource_id" text NOT NULL,
	"category_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_content_type_id_resource_content_type_id_fk" FOREIGN KEY ("content_type_id") REFERENCES "public"."resource_content_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_uploader_id_user_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_to_category" ADD CONSTRAINT "resource_to_category_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_to_category" ADD CONSTRAINT "resource_to_category_category_id_resource_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."resource_category"("id") ON DELETE cascade ON UPDATE no action;