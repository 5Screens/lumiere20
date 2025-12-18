-- AlterTable: Add is_active column with default
ALTER TABLE "configuration"."ticket_types" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add label column with default first
ALTER TABLE "configuration"."ticket_types" ADD COLUMN "label" VARCHAR(100) NOT NULL DEFAULT '';

-- Update existing rows: set label = code for existing ticket types
UPDATE "configuration"."ticket_types" SET "label" = "code" WHERE "label" = '';
