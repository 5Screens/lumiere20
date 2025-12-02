-- Migration: Convert ci_types from static labels to i18n keys

-- Step 1: Add new columns with defaults
ALTER TABLE "configuration"."ci_types" 
ADD COLUMN "label_key" VARCHAR(100),
ADD COLUMN "description_key" VARCHAR(100);

-- Step 2: Migrate existing data to i18n keys
UPDATE "configuration"."ci_types" SET 
  label_key = 'ciTypes.' || LOWER(REPLACE(code, '_', '')),
  description_key = 'ciTypes.' || LOWER(REPLACE(code, '_', '')) || 'Desc';

-- Step 3: Make label_key NOT NULL
ALTER TABLE "configuration"."ci_types" ALTER COLUMN "label_key" SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "configuration"."ci_types" DROP COLUMN "description";
ALTER TABLE "configuration"."ci_types" DROP COLUMN "label";
