CREATE TYPE "public"."role_name" AS ENUM('user', 'seller', 'admin');--> statement-breakpoint
CREATE TYPE "public"."category_name" AS ENUM('illustration', 'digital_painting', 'concept_art', 'character_design', 'environment_art', 'pixel_art', 'vector_art', 'typography', 'photo_manipulation', 'ui_kit', '3d_render', 'motion_graphic', 'fan_art', 'abstract', 'other');--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" "category_name" DEFAULT 'other',
	"description" text NOT NULL,
	"details" text,
	"slug" text NOT NULL,
	"price" bigint NOT NULL,
	"likes_count" bigint DEFAULT 0 NOT NULL,
	"downloads_count" bigint DEFAULT 0 NOT NULL,
	"allowed_formats" jsonb NOT NULL,
	"tags" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;