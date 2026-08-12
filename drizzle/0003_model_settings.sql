CREATE TABLE "model_settings" (
	"model_id" text PRIMARY KEY NOT NULL,
	"monthly_12" integer,
	"monthly_24" integer,
	"monthly_36" integer,
	"monthly_48" integer,
	"monthly_60" integer,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
