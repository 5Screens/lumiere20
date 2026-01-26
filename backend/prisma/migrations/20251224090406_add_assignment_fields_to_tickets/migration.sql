/*
  Warnings:

  - You are about to drop the `rel_tickets_groups_persons` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "core"."rel_tickets_groups_persons" DROP CONSTRAINT "rel_tickets_groups_persons_rel_assigned_to_group_fkey";

-- DropForeignKey
ALTER TABLE "core"."rel_tickets_groups_persons" DROP CONSTRAINT "rel_tickets_groups_persons_rel_assigned_to_person_fkey";

-- DropForeignKey
ALTER TABLE "core"."rel_tickets_groups_persons" DROP CONSTRAINT "rel_tickets_groups_persons_rel_ticket_fkey";

-- AlterTable
ALTER TABLE "core"."tickets" ADD COLUMN     "assigned_group_uuid" UUID,
ADD COLUMN     "assigned_person_uuid" UUID;

-- DropTable
DROP TABLE "core"."rel_tickets_groups_persons";

-- AddForeignKey
ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_assigned_group_uuid_fkey" FOREIGN KEY ("assigned_group_uuid") REFERENCES "configuration"."groups"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_assigned_person_uuid_fkey" FOREIGN KEY ("assigned_person_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
