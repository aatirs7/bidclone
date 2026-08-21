CREATE TYPE "public"."entry_status" AS ENUM('active', 'hidden', 'refunded');--> statement-breakpoint
CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"stripe_session_id" text NOT NULL,
	"rank_after" integer,
	"took_seat_from" uuid,
	"displaced_reign_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"visitor_hash" text NOT NULL,
	"hour_bucket" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"display_name" text NOT NULL,
	"tagline" text,
	"favicon_url" text,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"first_bid_at" timestamp with time zone,
	"last_bid_at" timestamp with time zone,
	"reign_started_at" timestamp with time zone,
	"longest_reign_seconds" integer DEFAULT 0 NOT NULL,
	"times_at_one" integer DEFAULT 0 NOT NULL,
	"status" "entry_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_hash" text NOT NULL,
	"minute_bucket" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bids_stripe_session_id_key" ON "bids" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "bids_entry_idx" ON "bids" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "bids_created_idx" ON "bids" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "clicks_dedupe" ON "clicks" USING btree ("entry_id","visitor_hash","hour_bucket");--> statement-breakpoint
CREATE INDEX "clicks_created_idx" ON "clicks" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "clicks_entry_idx" ON "clicks" USING btree ("entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entries_url_key" ON "entries" USING btree ("url");--> statement-breakpoint
CREATE INDEX "entries_rank_idx" ON "entries" USING btree ("total_cents" DESC NULLS LAST,"first_bid_at");--> statement-breakpoint
CREATE INDEX "entries_reign_idx" ON "entries" USING btree ("longest_reign_seconds" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "visits_dedupe" ON "visits" USING btree ("visitor_hash","minute_bucket");--> statement-breakpoint
CREATE INDEX "visits_created_idx" ON "visits" USING btree ("created_at" DESC NULLS LAST);