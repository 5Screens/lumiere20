/*
  Warnings:

  - You are about to drop the column `lifecycle_status` on the `services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "data"."service_offerings" ADD COLUMN     "rel_lifecycle_status_uuid" UUID;

-- AlterTable
ALTER TABLE "data"."services" DROP COLUMN "lifecycle_status",
ADD COLUMN     "rel_lifecycle_status_uuid" UUID;

-- CreateTable
CREATE TABLE "data"."user_sets" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sets_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."calendars" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "timezone" VARCHAR(100) NOT NULL,
    "parent_uuid" UUID,
    "schedule" JSONB NOT NULL,
    "holidays" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."sla_definitions" (
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

    CONSTRAINT "sla_definitions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."sla_commitments" (
    "uuid" UUID NOT NULL,
    "rel_service_offering_uuid" UUID NOT NULL,
    "rel_sla_definition_uuid" UUID NOT NULL,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sla_commitments_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."service_offering_subscriptions" (
    "uuid" UUID NOT NULL,
    "rel_service_offering_uuid" UUID NOT NULL,
    "subscriber_type" VARCHAR(50) NOT NULL,
    "rel_user_set_uuid" UUID,
    "rel_location_uuid" UUID,
    "rel_entity_uuid" UUID,
    "rel_group_uuid" UUID,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_offering_subscriptions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."rel_service_offerings_cis" (
    "uuid" UUID NOT NULL,
    "rel_service_offering_uuid" UUID NOT NULL,
    "rel_ci_uuid" UUID NOT NULL,
    "relationship_type" VARCHAR(50),
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rel_service_offerings_cis_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "sla_commitments_rel_service_offering_uuid_rel_sla_definitio_key" ON "data"."sla_commitments"("rel_service_offering_uuid", "rel_sla_definition_uuid");

-- CreateIndex
CREATE INDEX "service_offering_subscriptions_rel_service_offering_uuid_idx" ON "data"."service_offering_subscriptions"("rel_service_offering_uuid");

-- CreateIndex
CREATE INDEX "service_offering_subscriptions_subscriber_type_idx" ON "data"."service_offering_subscriptions"("subscriber_type");

-- CreateIndex
CREATE INDEX "rel_service_offerings_cis_rel_service_offering_uuid_idx" ON "data"."rel_service_offerings_cis"("rel_service_offering_uuid");

-- CreateIndex
CREATE INDEX "rel_service_offerings_cis_rel_ci_uuid_idx" ON "data"."rel_service_offerings_cis"("rel_ci_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rel_service_offerings_cis_rel_service_offering_uuid_rel_ci__key" ON "data"."rel_service_offerings_cis"("rel_service_offering_uuid", "rel_ci_uuid");

-- CreateIndex
CREATE INDEX "service_offerings_rel_lifecycle_status_uuid_idx" ON "data"."service_offerings"("rel_lifecycle_status_uuid");

-- CreateIndex
CREATE INDEX "services_rel_lifecycle_status_uuid_idx" ON "data"."services"("rel_lifecycle_status_uuid");

-- AddForeignKey
ALTER TABLE "data"."services" ADD CONSTRAINT "services_rel_lifecycle_status_uuid_fkey" FOREIGN KEY ("rel_lifecycle_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offerings" ADD CONSTRAINT "service_offerings_rel_lifecycle_status_uuid_fkey" FOREIGN KEY ("rel_lifecycle_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."calendars" ADD CONSTRAINT "calendars_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "data"."calendars"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."sla_definitions" ADD CONSTRAINT "sla_definitions_rel_calendar_uuid_fkey" FOREIGN KEY ("rel_calendar_uuid") REFERENCES "data"."calendars"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."sla_commitments" ADD CONSTRAINT "sla_commitments_rel_service_offering_uuid_fkey" FOREIGN KEY ("rel_service_offering_uuid") REFERENCES "data"."service_offerings"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."sla_commitments" ADD CONSTRAINT "sla_commitments_rel_sla_definition_uuid_fkey" FOREIGN KEY ("rel_sla_definition_uuid") REFERENCES "data"."sla_definitions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offering_subscriptions" ADD CONSTRAINT "service_offering_subscriptions_rel_service_offering_uuid_fkey" FOREIGN KEY ("rel_service_offering_uuid") REFERENCES "data"."service_offerings"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offering_subscriptions" ADD CONSTRAINT "service_offering_subscriptions_rel_user_set_uuid_fkey" FOREIGN KEY ("rel_user_set_uuid") REFERENCES "data"."user_sets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offering_subscriptions" ADD CONSTRAINT "service_offering_subscriptions_rel_location_uuid_fkey" FOREIGN KEY ("rel_location_uuid") REFERENCES "configuration"."locations"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offering_subscriptions" ADD CONSTRAINT "service_offering_subscriptions_rel_entity_uuid_fkey" FOREIGN KEY ("rel_entity_uuid") REFERENCES "configuration"."entities"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offering_subscriptions" ADD CONSTRAINT "service_offering_subscriptions_rel_group_uuid_fkey" FOREIGN KEY ("rel_group_uuid") REFERENCES "configuration"."groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."rel_service_offerings_cis" ADD CONSTRAINT "rel_service_offerings_cis_rel_service_offering_uuid_fkey" FOREIGN KEY ("rel_service_offering_uuid") REFERENCES "data"."service_offerings"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."rel_service_offerings_cis" ADD CONSTRAINT "rel_service_offerings_cis_rel_ci_uuid_fkey" FOREIGN KEY ("rel_ci_uuid") REFERENCES "data"."configuration_items"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
