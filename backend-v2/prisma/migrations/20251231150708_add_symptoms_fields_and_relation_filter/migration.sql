/*
  Warnings:

  - Added the required column `label` to the `symptoms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "configuration"."symptoms" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "label" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "configuration"."ticket_type_fields" ADD COLUMN     "relation_filter" JSONB;
