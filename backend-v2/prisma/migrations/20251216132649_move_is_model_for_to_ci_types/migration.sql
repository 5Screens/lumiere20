/*
  Warnings:

  - You are about to drop the column `is_model_for_ci_type_uuid` on the `configuration_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "data"."configuration_items" DROP CONSTRAINT "configuration_items_is_model_for_ci_type_uuid_fkey";

-- DropIndex
DROP INDEX "data"."configuration_items_is_model_for_ci_type_uuid_idx";

-- AlterTable
ALTER TABLE "configuration"."ci_types" ADD COLUMN     "is_model_for_ci_type_uuid" UUID;

-- AlterTable
ALTER TABLE "data"."configuration_items" DROP COLUMN "is_model_for_ci_type_uuid";

-- CreateIndex
CREATE INDEX "ci_types_is_model_for_ci_type_uuid_idx" ON "configuration"."ci_types"("is_model_for_ci_type_uuid");

-- AddForeignKey
ALTER TABLE "configuration"."ci_types" ADD CONSTRAINT "ci_types_is_model_for_ci_type_uuid_fkey" FOREIGN KEY ("is_model_for_ci_type_uuid") REFERENCES "configuration"."ci_types"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
