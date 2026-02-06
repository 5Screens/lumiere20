/*
  Warnings:

  - You are about to drop the column `rel_service_offering_uuid` on the `request_catalog_items` table. All the data in the column will be lost.
  - You are about to drop the `rel_request_catalog_items_cis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "data"."rel_request_catalog_items_cis" DROP CONSTRAINT "rel_request_catalog_items_cis_rel_ci_uuid_fkey";

-- DropForeignKey
ALTER TABLE "data"."rel_request_catalog_items_cis" DROP CONSTRAINT "rel_request_catalog_items_cis_rel_request_catalog_item_uui_fkey";

-- DropForeignKey
ALTER TABLE "data"."request_catalog_items" DROP CONSTRAINT "request_catalog_items_rel_service_offering_uuid_fkey";

-- DropIndex
DROP INDEX "data"."request_catalog_items_rel_service_offering_uuid_idx";

-- AlterTable
ALTER TABLE "configuration"."causes" ADD COLUMN     "rel_service_uuid" UUID;

-- AlterTable
ALTER TABLE "configuration"."symptoms" ADD COLUMN     "rel_service_uuid" UUID;

-- AlterTable
ALTER TABLE "data"."request_catalog_items" DROP COLUMN "rel_service_offering_uuid",
ADD COLUMN     "rel_service_uuid" UUID;

-- DropTable
DROP TABLE "data"."rel_request_catalog_items_cis";

-- CreateIndex
CREATE INDEX "causes_rel_service_uuid_idx" ON "configuration"."causes"("rel_service_uuid");

-- CreateIndex
CREATE INDEX "symptoms_rel_service_uuid_idx" ON "configuration"."symptoms"("rel_service_uuid");

-- CreateIndex
CREATE INDEX "request_catalog_items_rel_service_uuid_idx" ON "data"."request_catalog_items"("rel_service_uuid");

-- AddForeignKey
ALTER TABLE "data"."request_catalog_items" ADD CONSTRAINT "request_catalog_items_rel_service_uuid_fkey" FOREIGN KEY ("rel_service_uuid") REFERENCES "data"."services"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."symptoms" ADD CONSTRAINT "symptoms_rel_service_uuid_fkey" FOREIGN KEY ("rel_service_uuid") REFERENCES "data"."services"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."causes" ADD CONSTRAINT "causes_rel_service_uuid_fkey" FOREIGN KEY ("rel_service_uuid") REFERENCES "data"."services"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
