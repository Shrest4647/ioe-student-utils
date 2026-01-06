CREATE TABLE "resource_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"file_format" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resource_attachment" ADD CONSTRAINT "resource_attachment_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;