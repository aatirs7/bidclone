CREATE TYPE "public"."powerup_kind" AS ENUM('seat_lock', 'challenge', 'last_stand', 'spotlight');--> statement-breakpoint
CREATE TABLE "powerups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"kind" "powerup_kind" NOT NULL,
	"amount_cents" integer NOT NULL,
	"stripe_session_id" text NOT NULL,
	"expires_at" timestamp with time zone,
	"target_entry_id" uuid,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "powerups" ADD CONSTRAINT "powerups_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "powerups_stripe_session_id_key" ON "powerups" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "powerups_active_idx" ON "powerups" USING btree ("kind","expires_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "powerups_entry_idx" ON "powerups" USING btree ("entry_id");