/*
  Warnings:

  - You are about to drop the column `ticket_status_code` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "core"."tickets" DROP COLUMN "ticket_status_code",
ADD COLUMN     "watchers" JSONB;

-- CreateTable
CREATE TABLE "core"."attachments" (
    "uuid" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "uploaded_by_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "attachments_entity_type_entity_uuid_idx" ON "core"."attachments"("entity_type", "entity_uuid");

-- AddForeignKey
ALTER TABLE "core"."attachments" ADD CONSTRAINT "attachments_uploaded_by_uuid_fkey" FOREIGN KEY ("uploaded_by_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."attachments" ADD CONSTRAINT "attachments_ticket_fkey" FOREIGN KEY ("entity_uuid") REFERENCES "core"."tickets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
