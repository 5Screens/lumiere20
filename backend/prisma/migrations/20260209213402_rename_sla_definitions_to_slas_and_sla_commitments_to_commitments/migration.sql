/*
  Warnings:

  - You are about to drop the `sla_commitments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sla_definitions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "data"."sla_commitments" DROP CONSTRAINT "sla_commitments_rel_service_offering_uuid_fkey";

-- DropForeignKey
ALTER TABLE "data"."sla_commitments" DROP CONSTRAINT "sla_commitments_rel_sla_definition_uuid_fkey";

-- DropForeignKey
ALTER TABLE "data"."sla_definitions" DROP CONSTRAINT "sla_definitions_rel_calendar_uuid_fkey";

-- DropTable
DROP TABLE "data"."sla_commitments";

-- DropTable
DROP TABLE "data"."sla_definitions";

-- CreateTable
CREATE TABLE "data"."slas" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "metric_type" VARCHAR(50) NOT NULL,
    "priority_code" VARCHAR(50),
    "target_value" DOUBLE PRECISION NOT NULL,
    "target_unit" VARCHAR(20) NOT NULL,
    "target_percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "rel_calendar_uuid" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slas_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."commitments" (
    "uuid" UUID NOT NULL,
    "rel_service_offering_uuid" UUID NOT NULL,
    "rel_sla_definition_uuid" UUID NOT NULL,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commitments_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "commitments_rel_service_offering_uuid_rel_sla_definition_uu_key" ON "data"."commitments"("rel_service_offering_uuid", "rel_sla_definition_uuid");

-- AddForeignKey
ALTER TABLE "data"."slas" ADD CONSTRAINT "slas_rel_calendar_uuid_fkey" FOREIGN KEY ("rel_calendar_uuid") REFERENCES "data"."calendars"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."commitments" ADD CONSTRAINT "commitments_rel_service_offering_uuid_fkey" FOREIGN KEY ("rel_service_offering_uuid") REFERENCES "data"."service_offerings"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."commitments" ADD CONSTRAINT "commitments_rel_sla_definition_uuid_fkey" FOREIGN KEY ("rel_sla_definition_uuid") REFERENCES "data"."slas"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
