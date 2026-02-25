-- CreateTable
CREATE TABLE "workflow"."workflow_actions" (
    "uuid" UUID NOT NULL,
    "rel_workflow_uuid" UUID NOT NULL,
    "rel_status_uuid" UUID,
    "rel_transition_uuid" UUID,
    "trigger" VARCHAR(20) NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255),
    "config" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_actions_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "workflow_actions_rel_workflow_uuid_idx" ON "workflow"."workflow_actions"("rel_workflow_uuid");

-- CreateIndex
CREATE INDEX "workflow_actions_rel_status_uuid_trigger_sort_order_idx" ON "workflow"."workflow_actions"("rel_status_uuid", "trigger", "sort_order");

-- CreateIndex
CREATE INDEX "workflow_actions_rel_transition_uuid_sort_order_idx" ON "workflow"."workflow_actions"("rel_transition_uuid", "sort_order");

-- AddForeignKey
ALTER TABLE "workflow"."workflow_actions" ADD CONSTRAINT "workflow_actions_rel_workflow_uuid_fkey" FOREIGN KEY ("rel_workflow_uuid") REFERENCES "workflow"."workflows"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_actions" ADD CONSTRAINT "workflow_actions_rel_status_uuid_fkey" FOREIGN KEY ("rel_status_uuid") REFERENCES "workflow"."workflow_statuses"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_actions" ADD CONSTRAINT "workflow_actions_rel_transition_uuid_fkey" FOREIGN KEY ("rel_transition_uuid") REFERENCES "workflow"."workflow_transitions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
