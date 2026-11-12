ALTER TABLE "reservations" ADD COLUMN "cancel_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "cancel_request_note" text DEFAULT '' NOT NULL;