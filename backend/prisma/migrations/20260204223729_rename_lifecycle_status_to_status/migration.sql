/*
  Warnings:

  - You are about to drop the column `rel_lifecycle_status_uuid` on the `service_offerings` table. All the data in the column will be lost.
  - You are about to drop the column `rel_lifecycle_status_uuid` on the `services` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "data"."service_offerings" DROP CONSTRAINT "service_offerings_rel_lifecycle_status_uuid_fkey";

-- DropForeignKey
ALTER TABLE "data"."services" DROP CONSTRAINT "services_rel_lifecycle_status_uuid_fkey";

-- DropIndex
DROP INDEX "data"."service_offerings_rel_lifecycle_status_uuid_idx";

-- DropIndex
DROP INDEX "data"."services_rel_lifecycle_status_uuid_idx";

-- AlterTable
ALTER TABLE "data"."service_offerings" DROP COLUMN "rel_lifecycle_status_uuid",
ADD COLUMN     "rel_status_uuid" UUID;

-- AlterTable
ALTER TABLE "data"."services" DROP COLUMN "rel_lifecycle_status_uuid",
ADD COLUMN     "rel_status_uuid" UUID;

-- CreateIndex
CREATE INDEX "service_offerings_rel_status_uuid_idx" ON "data"."service_offerings"("rel_status_uuid");

-- CreateIndex
CREATE INDEX "services_rel_status_uuid_idx" ON "data"."services"("rel_status_uuid");

-- AddForeignKey
ALTER TABLE "data"."services" ADD CONSTRAINT "services_rel_status_uuid_fkey" FOREIGN KEY ("rel_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offerings" ADD CONSTRAINT "service_offerings_rel_status_uuid_fkey" FOREIGN KEY ("rel_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
