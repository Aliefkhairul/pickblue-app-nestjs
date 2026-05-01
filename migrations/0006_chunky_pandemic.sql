CREATE TYPE "public"."payment_status_name" AS ENUM('pending', 'settled', 'expired', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"order_id" text NOT NULL,
	"external_id" text,
	"invoice_id" text,
	"payment_url" text,
	"snap_token" text,
	"amount" bigint NOT NULL,
	"status" "payment_status_name" DEFAULT 'pending',
	"provider" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;