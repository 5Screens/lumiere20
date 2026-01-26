-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateTable
CREATE TABLE "audit"."audit_changes" (
    "uuid" UUID NOT NULL,
    "object_type" VARCHAR(50) NOT NULL,
    "object_uuid" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "attribute_name" VARCHAR(255),
    "old_value" TEXT,
    "new_value" TEXT,
    "rel_user_uuid" UUID NOT NULL,
    "event_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_changes_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "audit_changes_object_uuid_idx" ON "audit"."audit_changes"("object_uuid");

-- CreateIndex
CREATE INDEX "audit_changes_rel_user_uuid_idx" ON "audit"."audit_changes"("rel_user_uuid");

-- CreateIndex
CREATE INDEX "audit_changes_event_date_idx" ON "audit"."audit_changes"("event_date");

-- CreateIndex
CREATE INDEX "audit_changes_event_type_idx" ON "audit"."audit_changes"("event_type");

-- CreateIndex
CREATE INDEX "audit_changes_object_type_idx" ON "audit"."audit_changes"("object_type");

-- AddForeignKey
ALTER TABLE "audit"."audit_changes" ADD CONSTRAINT "audit_changes_rel_user_uuid_fkey" FOREIGN KEY ("rel_user_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
