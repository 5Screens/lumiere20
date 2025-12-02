/*
  Warnings:

  - You are about to drop the column `description_key` on the `ci_types` table. All the data in the column will be lost.
  - You are about to drop the column `label_key` on the `ci_types` table. All the data in the column will be lost.
  - Added the required column `label` to the `ci_types` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add new columns with defaults
ALTER TABLE "configuration"."ci_types" 
ADD COLUMN "label" VARCHAR(255),
ADD COLUMN "description" TEXT;

-- Step 2: Migrate data from label_key to label (extract the last part of the key as default label)
-- Map existing label_key values to readable labels
UPDATE "configuration"."ci_types" SET 
  "label" = CASE 
    WHEN "label_key" = 'ciTypes.ups' THEN 'UPS'
    WHEN "label_key" = 'ciTypes.application' THEN 'Application'
    WHEN "label_key" = 'ciTypes.server' THEN 'Server'
    WHEN "label_key" = 'ciTypes.networkDevice' THEN 'Network Device'
    WHEN "label_key" = 'ciTypes.storage' THEN 'Storage'
    WHEN "label_key" = 'ciTypes.workstation' THEN 'Workstation'
    WHEN "label_key" = 'ciTypes.printer' THEN 'Printer'
    WHEN "label_key" = 'ciTypes.mobileDevice' THEN 'Mobile Device'
    WHEN "label_key" = 'ciTypes.database' THEN 'Database'
    WHEN "label_key" = 'ciTypes.generic' THEN 'Generic'
    ELSE COALESCE("code", 'Unknown')
  END,
  "description" = CASE 
    WHEN "description_key" = 'ciTypes.upsDesc' THEN 'Uninterruptible Power Supply'
    WHEN "description_key" = 'ciTypes.applicationDesc' THEN 'Software application'
    WHEN "description_key" = 'ciTypes.serverDesc' THEN 'Physical or virtual server'
    WHEN "description_key" = 'ciTypes.networkDeviceDesc' THEN 'Router, switch, firewall, etc.'
    WHEN "description_key" = 'ciTypes.storageDesc' THEN 'SAN, NAS, storage arrays'
    WHEN "description_key" = 'ciTypes.workstationDesc' THEN 'Desktop or laptop computer'
    WHEN "description_key" = 'ciTypes.printerDesc' THEN 'Printer or multifunction device'
    WHEN "description_key" = 'ciTypes.mobileDeviceDesc' THEN 'Smartphone, tablet'
    WHEN "description_key" = 'ciTypes.databaseDesc' THEN 'Database instance'
    WHEN "description_key" = 'ciTypes.genericDesc' THEN 'Generic configuration item'
    ELSE NULL
  END;

-- Step 3: Make label NOT NULL now that all rows have values
ALTER TABLE "configuration"."ci_types" ALTER COLUMN "label" SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "configuration"."ci_types" DROP COLUMN "description_key", DROP COLUMN "label_key";

-- AlterTable
ALTER TABLE "configuration"."object_fields" ADD COLUMN     "is_translatable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "translations"."ci_types_translation" (
    "uuid" UUID NOT NULL,
    "ci_type_uuid" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "field_name" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ci_types_translation_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "translations"."entity_translations" (
    "uuid" UUID NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_translations_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "ci_types_translation_ci_type_uuid_idx" ON "translations"."ci_types_translation"("ci_type_uuid");

-- CreateIndex
CREATE INDEX "ci_types_translation_locale_idx" ON "translations"."ci_types_translation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ci_types_translation_ci_type_uuid_locale_field_name_key" ON "translations"."ci_types_translation"("ci_type_uuid", "locale", "field_name");

-- CreateIndex
CREATE INDEX "entity_translations_entity_type_entity_uuid_idx" ON "translations"."entity_translations"("entity_type", "entity_uuid");

-- CreateIndex
CREATE INDEX "entity_translations_locale_idx" ON "translations"."entity_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "entity_translations_entity_type_entity_uuid_field_name_loca_key" ON "translations"."entity_translations"("entity_type", "entity_uuid", "field_name", "locale");

-- AddForeignKey
ALTER TABLE "translations"."ci_types_translation" ADD CONSTRAINT "ci_types_translation_ci_type_uuid_fkey" FOREIGN KEY ("ci_type_uuid") REFERENCES "configuration"."ci_types"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
