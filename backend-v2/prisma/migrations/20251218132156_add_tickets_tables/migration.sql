/*
  Warnings:

  - You are about to drop the column `core_extended_attributes` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `user_extended_attributes` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "core"."tickets" DROP COLUMN "core_extended_attributes",
DROP COLUMN "user_extended_attributes",
ADD COLUMN     "extended_core_fields" JSONB,
ADD COLUMN     "rel_status_uuid" UUID;

-- CreateTable
CREATE TABLE "core"."rel_tickets_groups_persons" (
    "uuid" UUID NOT NULL,
    "rel_ticket" UUID NOT NULL,
    "rel_assigned_to_group" UUID,
    "rel_assigned_to_person" UUID,
    "type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "rel_tickets_groups_persons_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "rel_tickets_groups_persons_rel_ticket_idx" ON "core"."rel_tickets_groups_persons"("rel_ticket");

-- CreateIndex
CREATE INDEX "rel_tickets_groups_persons_rel_assigned_to_group_idx" ON "core"."rel_tickets_groups_persons"("rel_assigned_to_group");

-- CreateIndex
CREATE INDEX "rel_tickets_groups_persons_rel_assigned_to_person_idx" ON "core"."rel_tickets_groups_persons"("rel_assigned_to_person");

-- CreateIndex
CREATE INDEX "rel_tickets_groups_persons_type_idx" ON "core"."rel_tickets_groups_persons"("type");

-- CreateIndex
CREATE INDEX "rel_tickets_groups_persons_rel_ticket_ended_at_idx" ON "core"."rel_tickets_groups_persons"("rel_ticket", "ended_at");

-- AddForeignKey
ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_rel_status_uuid_fkey" FOREIGN KEY ("rel_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."rel_tickets_groups_persons" ADD CONSTRAINT "rel_tickets_groups_persons_rel_ticket_fkey" FOREIGN KEY ("rel_ticket") REFERENCES "core"."tickets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."rel_tickets_groups_persons" ADD CONSTRAINT "rel_tickets_groups_persons_rel_assigned_to_group_fkey" FOREIGN KEY ("rel_assigned_to_group") REFERENCES "configuration"."groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."rel_tickets_groups_persons" ADD CONSTRAINT "rel_tickets_groups_persons_rel_assigned_to_person_fkey" FOREIGN KEY ("rel_assigned_to_person") REFERENCES "configuration"."persons"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
