/*
  Warnings:

  - You are about to drop the column `is_model_for_ci_type_uuid` on the `ci_types` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "configuration"."ci_types" DROP CONSTRAINT "ci_types_is_model_for_ci_type_uuid_fkey";

-- DropIndex
DROP INDEX "configuration"."ci_types_is_model_for_ci_type_uuid_idx";

-- AlterTable
ALTER TABLE "configuration"."ci_types" DROP COLUMN "is_model_for_ci_type_uuid",
ADD COLUMN     "is_model_for_ci_type_code" VARCHAR(50);

-- CreateIndex
CREATE INDEX "ci_types_is_model_for_ci_type_code_idx" ON "configuration"."ci_types"("is_model_for_ci_type_code");
