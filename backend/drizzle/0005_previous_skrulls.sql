CREATE TABLE IF NOT EXISTS "daily_briefs" (
	"user_id" integer NOT NULL,
	"brief_date" date NOT NULL,
	"text" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_briefs_user_id_brief_date_pk" PRIMARY KEY("user_id","brief_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "widget_alerts" (
	"widget_instance_id" integer PRIMARY KEY NOT NULL,
	"operator" text NOT NULL,
	"threshold" double precision NOT NULL,
	"last_notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "widget_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"widget_instance_id" integer NOT NULL,
	"value" double precision NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_briefs" ADD CONSTRAINT "daily_briefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "widget_alerts" ADD CONSTRAINT "widget_alerts_widget_instance_id_widget_instances_id_fk" FOREIGN KEY ("widget_instance_id") REFERENCES "public"."widget_instances"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "widget_history" ADD CONSTRAINT "widget_history_widget_instance_id_widget_instances_id_fk" FOREIGN KEY ("widget_instance_id") REFERENCES "public"."widget_instances"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
