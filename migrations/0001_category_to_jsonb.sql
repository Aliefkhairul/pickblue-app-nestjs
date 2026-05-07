-- Convert category column from enum to jsonb array
-- Step 1: Add a new jsonb column
ALTER TABLE "products" ADD COLUMN "category_new" jsonb NOT NULL DEFAULT '["other"]';

-- Step 2: Migrate existing data from enum to jsonb array
UPDATE "products" SET "category_new" = jsonb_build_array("category");

-- Step 3: Drop the old enum column
ALTER TABLE "products" DROP COLUMN "category";

-- Step 4: Rename the new column
ALTER TABLE "products" RENAME COLUMN "category_new" TO "category";

-- Step 5: Drop the enum type (optional, can be done later if no other tables use it)
-- DROP TYPE IF EXISTS "public"."category_name";
