-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "workflow";

-- CreateTable
CREATE TABLE "workflow"."workflow_status_categories" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "color" VARCHAR(20) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_status_categories_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "workflow"."workflows" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "entity_type" VARCHAR(100) NOT NULL,
    "rel_entity_type_uuid" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "workflow"."workflow_statuses" (
    "uuid" UUID NOT NULL,
    "rel_workflow_uuid" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "rel_category_uuid" UUID NOT NULL,
    "allow_all_inbound" BOOLEAN NOT NULL DEFAULT true,
    "is_initial" BOOLEAN NOT NULL DEFAULT false,
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_statuses_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "workflow"."workflow_transitions" (
    "uuid" UUID NOT NULL,
    "rel_workflow_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "rel_to_status_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "workflow"."workflow_transition_sources" (
    "uuid" UUID NOT NULL,
    "rel_transition_uuid" UUID NOT NULL,
    "rel_from_status_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transition_sources_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_status_categories_code_key" ON "workflow"."workflow_status_categories"("code");

-- CreateIndex
CREATE INDEX "workflows_entity_type_idx" ON "workflow"."workflows"("entity_type");

-- CreateIndex
CREATE INDEX "workflows_rel_entity_type_uuid_idx" ON "workflow"."workflows"("rel_entity_type_uuid");

-- CreateIndex
CREATE INDEX "workflow_statuses_rel_workflow_uuid_idx" ON "workflow"."workflow_statuses"("rel_workflow_uuid");

-- CreateIndex
CREATE INDEX "workflow_statuses_rel_category_uuid_idx" ON "workflow"."workflow_statuses"("rel_category_uuid");

-- CreateIndex
CREATE INDEX "workflow_transitions_rel_workflow_uuid_idx" ON "workflow"."workflow_transitions"("rel_workflow_uuid");

-- CreateIndex
CREATE INDEX "workflow_transitions_rel_to_status_uuid_idx" ON "workflow"."workflow_transitions"("rel_to_status_uuid");

-- CreateIndex
CREATE INDEX "workflow_transition_sources_rel_transition_uuid_idx" ON "workflow"."workflow_transition_sources"("rel_transition_uuid");

-- CreateIndex
CREATE INDEX "workflow_transition_sources_rel_from_status_uuid_idx" ON "workflow"."workflow_transition_sources"("rel_from_status_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_transition_sources_rel_transition_uuid_rel_from_st_key" ON "workflow"."workflow_transition_sources"("rel_transition_uuid", "rel_from_status_uuid");

-- AddForeignKey
ALTER TABLE "workflow"."workflow_statuses" ADD CONSTRAINT "workflow_statuses_rel_workflow_uuid_fkey" FOREIGN KEY ("rel_workflow_uuid") REFERENCES "workflow"."workflows"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_statuses" ADD CONSTRAINT "workflow_statuses_rel_category_uuid_fkey" FOREIGN KEY ("rel_category_uuid") REFERENCES "workflow"."workflow_status_categories"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_transitions" ADD CONSTRAINT "workflow_transitions_rel_workflow_uuid_fkey" FOREIGN KEY ("rel_workflow_uuid") REFERENCES "workflow"."workflows"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_transitions" ADD CONSTRAINT "workflow_transitions_rel_to_status_uuid_fkey" FOREIGN KEY ("rel_to_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_transition_sources" ADD CONSTRAINT "workflow_transition_sources_rel_transition_uuid_fkey" FOREIGN KEY ("rel_transition_uuid") REFERENCES "workflow"."workflow_transitions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_transition_sources" ADD CONSTRAINT "workflow_transition_sources_rel_from_status_uuid_fkey" FOREIGN KEY ("rel_from_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
