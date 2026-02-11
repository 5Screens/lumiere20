/*
  Warnings:

  - You are about to drop the column `rel_service_uuid` on the `causes` table. All the data in the column will be lost.
  - You are about to drop the column `rel_service_uuid` on the `symptoms` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "configuration"."causes" DROP CONSTRAINT "causes_rel_service_uuid_fkey";

-- DropForeignKey
ALTER TABLE "configuration"."symptoms" DROP CONSTRAINT "symptoms_rel_service_uuid_fkey";

-- DropIndex
DROP INDEX "configuration"."causes_rel_service_uuid_idx";

-- DropIndex
DROP INDEX "configuration"."symptoms_rel_service_uuid_idx";

-- AlterTable
ALTER TABLE "configuration"."causes" DROP COLUMN "rel_service_uuid";

-- AlterTable
ALTER TABLE "configuration"."symptoms" DROP COLUMN "rel_service_uuid";

-- CreateTable
CREATE TABLE "configuration"."rel_symptoms_services" (
    "uuid" UUID NOT NULL,
    "rel_symptom_uuid" UUID NOT NULL,
    "rel_service_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rel_symptoms_services_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."rel_causes_services" (
    "uuid" UUID NOT NULL,
    "rel_cause_uuid" UUID NOT NULL,
    "rel_service_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rel_causes_services_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "rel_symptoms_services_rel_symptom_uuid_idx" ON "configuration"."rel_symptoms_services"("rel_symptom_uuid");

-- CreateIndex
CREATE INDEX "rel_symptoms_services_rel_service_uuid_idx" ON "configuration"."rel_symptoms_services"("rel_service_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rel_symptoms_services_rel_symptom_uuid_rel_service_uuid_key" ON "configuration"."rel_symptoms_services"("rel_symptom_uuid", "rel_service_uuid");

-- CreateIndex
CREATE INDEX "rel_causes_services_rel_cause_uuid_idx" ON "configuration"."rel_causes_services"("rel_cause_uuid");

-- CreateIndex
CREATE INDEX "rel_causes_services_rel_service_uuid_idx" ON "configuration"."rel_causes_services"("rel_service_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rel_causes_services_rel_cause_uuid_rel_service_uuid_key" ON "configuration"."rel_causes_services"("rel_cause_uuid", "rel_service_uuid");

-- AddForeignKey
ALTER TABLE "configuration"."rel_symptoms_services" ADD CONSTRAINT "rel_symptoms_services_rel_symptom_uuid_fkey" FOREIGN KEY ("rel_symptom_uuid") REFERENCES "configuration"."symptoms"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_symptoms_services" ADD CONSTRAINT "rel_symptoms_services_rel_service_uuid_fkey" FOREIGN KEY ("rel_service_uuid") REFERENCES "data"."services"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_causes_services" ADD CONSTRAINT "rel_causes_services_rel_cause_uuid_fkey" FOREIGN KEY ("rel_cause_uuid") REFERENCES "configuration"."causes"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_causes_services" ADD CONSTRAINT "rel_causes_services_rel_service_uuid_fkey" FOREIGN KEY ("rel_service_uuid") REFERENCES "data"."services"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
