-- AlterTable
ALTER TABLE "configuration"."ci_types" ADD COLUMN     "has_model" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "data"."configuration_items" ADD COLUMN     "rel_model_uuid" UUID;

-- AddForeignKey
ALTER TABLE "data"."configuration_items" ADD CONSTRAINT "configuration_items_rel_model_uuid_fkey" FOREIGN KEY ("rel_model_uuid") REFERENCES "data"."configuration_items"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
