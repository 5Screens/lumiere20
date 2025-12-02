/*
  Refactor: Single translations table (translated_fields)
  
  This migration:
  1. Creates the new translated_fields table
  2. Migrates data from ci_types_translation to translated_fields
  3. Drops the old tables
*/

-- Step 1: Create new table
CREATE TABLE "translations"."translated_fields" (
    "uuid" UUID NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translated_fields_pkey" PRIMARY KEY ("uuid")
);

-- Step 2: Migrate data from ci_types_translation to translated_fields
INSERT INTO "translations"."translated_fields" ("uuid", "entity_type", "entity_uuid", "field_name", "locale", "value", "created_at", "updated_at")
SELECT 
    gen_random_uuid(),
    'ci_types',
    "ci_type_uuid",
    "field_name",
    "locale",
    "value",
    "created_at",
    "updated_at"
FROM "translations"."ci_types_translation";

-- Step 3: Drop foreign key constraint
ALTER TABLE "translations"."ci_types_translation" DROP CONSTRAINT "ci_types_translation_ci_type_uuid_fkey";

-- Step 4: Drop old tables
DROP TABLE "translations"."ci_types_translation";
DROP TABLE "translations"."entity_translations";

-- Step 5: Create indexes
CREATE INDEX "translated_fields_entity_type_entity_uuid_idx" ON "translations"."translated_fields"("entity_type", "entity_uuid");
CREATE INDEX "translated_fields_locale_idx" ON "translations"."translated_fields"("locale");
CREATE UNIQUE INDEX "translated_fields_entity_type_entity_uuid_field_name_locale_key" ON "translations"."translated_fields"("entity_type", "entity_uuid", "field_name", "locale");
