-- AlterTable
ALTER TABLE "data"."configuration_items" ADD COLUMN     "is_model_for_ci_type_uuid" UUID;

-- CreateIndex
CREATE INDEX "configuration_items_is_model_for_ci_type_uuid_idx" ON "data"."configuration_items"("is_model_for_ci_type_uuid");

-- AddForeignKey
ALTER TABLE "data"."configuration_items" ADD CONSTRAINT "configuration_items_is_model_for_ci_type_uuid_fkey" FOREIGN KEY ("is_model_for_ci_type_uuid") REFERENCES "configuration"."ci_types"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
