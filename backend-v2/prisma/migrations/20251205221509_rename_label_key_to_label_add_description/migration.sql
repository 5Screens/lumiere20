-- Rename label_key to label (preserving data)
ALTER TABLE "configuration"."ci_type_fields" RENAME COLUMN "label_key" TO "label";

-- Change column type to VARCHAR(255)
ALTER TABLE "configuration"."ci_type_fields" ALTER COLUMN "label" TYPE VARCHAR(255);

-- Add description column
ALTER TABLE "configuration"."ci_type_fields" ADD COLUMN "description" VARCHAR(500);
