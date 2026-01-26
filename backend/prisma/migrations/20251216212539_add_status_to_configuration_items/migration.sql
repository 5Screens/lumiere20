-- AlterTable
ALTER TABLE "data"."configuration_items" ADD COLUMN     "rel_status_uuid" UUID;

-- CreateIndex
CREATE INDEX "configuration_items_rel_status_uuid_idx" ON "data"."configuration_items"("rel_status_uuid");

-- AddForeignKey
ALTER TABLE "data"."configuration_items" ADD CONSTRAINT "configuration_items_rel_status_uuid_fkey" FOREIGN KEY ("rel_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
