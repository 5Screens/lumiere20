-- CreateTable
CREATE TABLE "workflow"."workflow_entity_config" (
    "uuid" UUID NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "subtype_field" VARCHAR(100) NOT NULL,
    "subtype_table" VARCHAR(100),
    "subtype_uuid_field" VARCHAR(100),
    "subtype_code_field" VARCHAR(100),
    "subtype_label_field" VARCHAR(100),
    "subtype_options" JSONB,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_entity_config_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_entity_config_entity_type_key" ON "workflow"."workflow_entity_config"("entity_type");
