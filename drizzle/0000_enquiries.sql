CREATE TABLE "enquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"company" text NOT NULL,
	"vat_number" text,
	"message" text,
	"model_slug" text,
	"unit_ref" text,
	"term" integer,
	"source" text NOT NULL,
	"recommender_summary" text,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");