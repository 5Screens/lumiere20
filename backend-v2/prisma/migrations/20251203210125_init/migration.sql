-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "configuration";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "data";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "translations";

-- CreateTable
CREATE TABLE "data"."configuration_items" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "ci_type" VARCHAR(50) NOT NULL DEFAULT 'GENERIC',
    "extended_core_fields" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuration_items_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."services" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "owning_entity_uuid" UUID,
    "owned_by_uuid" UUID,
    "managed_by_uuid" UUID,
    "business_criticality" VARCHAR(50),
    "lifecycle_status" VARCHAR(50),
    "version" VARCHAR(50),
    "operational" VARCHAR(50),
    "legal_regulatory" VARCHAR(50),
    "reputational" VARCHAR(50),
    "financial" VARCHAR(50),
    "comments" TEXT,
    "cab_uuid" UUID,
    "parent_uuid" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."service_offerings" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "business_criticality" VARCHAR(50),
    "environment" VARCHAR(100),
    "price_model" VARCHAR(100),
    "currency" VARCHAR(3),
    "service_uuid" UUID NOT NULL,
    "operator_entity_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_offerings_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."ci_types" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ci_types_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."ticket_types" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."ticket_status" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "rel_ticket_type" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_status_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."symptoms" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptoms_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."entities" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "external_id" VARCHAR(100),
    "entity_type" VARCHAR(50) NOT NULL,
    "budget_approver_uuid" UUID,
    "rel_headquarters_location" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parent_uuid" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."locations" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "primary_entity_uuid" UUID,
    "field_service_group_uuid" UUID,
    "rel_status_uuid" UUID,
    "site_created_on" TIMESTAMPTZ(6),
    "site_id" VARCHAR(100),
    "type" VARCHAR(100),
    "business_criticality" VARCHAR(50),
    "opening_hours" VARCHAR(255),
    "parent_uuid" UUID,
    "phone" VARCHAR(50),
    "time_zone" VARCHAR(100),
    "street" VARCHAR(255),
    "city" VARCHAR(255),
    "state_province" VARCHAR(255),
    "country" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "comments" TEXT,
    "alternative_site_reference" VARCHAR(255),
    "wan_design" TEXT,
    "network_telecom_service" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."persons" (
    "uuid" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "job_role" VARCHAR(255),
    "ref_entity_uuid" UUID,
    "password_hash" VARCHAR(255),
    "password_needs_reset" BOOLEAN NOT NULL DEFAULT false,
    "locked_out" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "critical_user" BOOLEAN NOT NULL DEFAULT false,
    "external_user" BOOLEAN NOT NULL DEFAULT false,
    "date_format" VARCHAR(50),
    "internal_id" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "notification" BOOLEAN NOT NULL DEFAULT true,
    "time_zone" VARCHAR(100),
    "ref_location_uuid" UUID,
    "floor" VARCHAR(50),
    "room" VARCHAR(50),
    "ref_approving_manager_uuid" UUID,
    "phone" VARCHAR(50),
    "business_phone" VARCHAR(50),
    "business_mobile_phone" VARCHAR(50),
    "personal_mobile_phone" VARCHAR(50),
    "language" VARCHAR(10),
    "role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "roles" JSONB,
    "photo" TEXT,
    "last_login" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."groups" (
    "uuid" UUID NOT NULL,
    "group_name" VARCHAR(255) NOT NULL,
    "support_level" INTEGER,
    "description" TEXT,
    "rel_supervisor" UUID,
    "rel_manager" UUID,
    "rel_schedule" UUID,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."rel_persons_groups" (
    "uuid" UUID NOT NULL,
    "rel_member" UUID NOT NULL,
    "rel_group" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rel_persons_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."rel_persons_delegates" (
    "uuid" UUID NOT NULL,
    "person_uuid" UUID NOT NULL,
    "delegate_uuid" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rel_persons_delegates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."rel_entities_locations" (
    "uuid" UUID NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "location_uuid" UUID NOT NULL,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rel_entities_locations_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."rel_persons_entities" (
    "uuid" UUID NOT NULL,
    "person_uuid" UUID NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rel_persons_entities_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "core"."tickets" (
    "uuid" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "configuration_item_uuid" UUID,
    "requested_by_uuid" UUID,
    "requested_for_uuid" UUID,
    "writer_uuid" UUID NOT NULL,
    "ticket_type_code" VARCHAR(50) NOT NULL,
    "ticket_status_code" VARCHAR(50) NOT NULL,
    "core_extended_attributes" JSONB,
    "user_extended_attributes" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "core"."rel_parent_child_tickets" (
    "uuid" UUID NOT NULL,
    "rel_parent_ticket_uuid" UUID NOT NULL,
    "rel_child_ticket_uuid" UUID NOT NULL,
    "dependency_code" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "rel_parent_child_tickets_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "translations"."translated_fields" (
    "uuid" UUID NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translated_fields_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."object_types" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "label_key" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "api_endpoint" VARCHAR(255) NOT NULL,
    "default_sort_field" VARCHAR(100) NOT NULL DEFAULT 'updated_at',
    "default_sort_order" INTEGER NOT NULL DEFAULT -1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "object_types_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."object_fields" (
    "uuid" UUID NOT NULL,
    "object_type_uuid" UUID NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "label_key" VARCHAR(100) NOT NULL,
    "field_type" VARCHAR(50) NOT NULL,
    "data_type" VARCHAR(50) NOT NULL DEFAULT 'string',
    "show_in_table" BOOLEAN NOT NULL DEFAULT true,
    "show_in_form" BOOLEAN NOT NULL DEFAULT true,
    "show_in_detail" BOOLEAN NOT NULL DEFAULT true,
    "is_sortable" BOOLEAN NOT NULL DEFAULT true,
    "is_filterable" BOOLEAN NOT NULL DEFAULT true,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_readonly" BOOLEAN NOT NULL DEFAULT false,
    "is_translatable" BOOLEAN NOT NULL DEFAULT false,
    "min_width" VARCHAR(20),
    "default_visible" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "max_length" INTEGER,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "pattern" VARCHAR(255),
    "options_source" VARCHAR(255),
    "relation_object" VARCHAR(100),
    "relation_display" VARCHAR(100),
    "format_pattern" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "object_fields_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "configuration_items_ci_type_idx" ON "data"."configuration_items"("ci_type");

-- CreateIndex
CREATE UNIQUE INDEX "ci_types_code_key" ON "configuration"."ci_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_code_key" ON "configuration"."ticket_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_status_code_rel_ticket_type_key" ON "configuration"."ticket_status"("code", "rel_ticket_type");

-- CreateIndex
CREATE UNIQUE INDEX "symptoms_code_key" ON "configuration"."symptoms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "entities_entity_id_key" ON "configuration"."entities"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "persons_email_key" ON "configuration"."persons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rel_persons_groups_rel_member_rel_group_key" ON "configuration"."rel_persons_groups"("rel_member", "rel_group");

-- CreateIndex
CREATE UNIQUE INDEX "rel_persons_entities_person_uuid_entity_uuid_key" ON "configuration"."rel_persons_entities"("person_uuid", "entity_uuid");

-- CreateIndex
CREATE INDEX "translated_fields_entity_type_entity_uuid_idx" ON "translations"."translated_fields"("entity_type", "entity_uuid");

-- CreateIndex
CREATE INDEX "translated_fields_locale_idx" ON "translations"."translated_fields"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "translated_fields_entity_type_entity_uuid_field_name_locale_key" ON "translations"."translated_fields"("entity_type", "entity_uuid", "field_name", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "object_types_code_key" ON "configuration"."object_types"("code");

-- CreateIndex
CREATE INDEX "object_fields_object_type_uuid_display_order_idx" ON "configuration"."object_fields"("object_type_uuid", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "object_fields_object_type_uuid_field_name_key" ON "configuration"."object_fields"("object_type_uuid", "field_name");

-- AddForeignKey
ALTER TABLE "data"."services" ADD CONSTRAINT "services_owning_entity_uuid_fkey" FOREIGN KEY ("owning_entity_uuid") REFERENCES "configuration"."entities"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."services" ADD CONSTRAINT "services_owned_by_uuid_fkey" FOREIGN KEY ("owned_by_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."services" ADD CONSTRAINT "services_managed_by_uuid_fkey" FOREIGN KEY ("managed_by_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."services" ADD CONSTRAINT "services_cab_uuid_fkey" FOREIGN KEY ("cab_uuid") REFERENCES "configuration"."groups"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."services" ADD CONSTRAINT "services_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "data"."services"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offerings" ADD CONSTRAINT "service_offerings_service_uuid_fkey" FOREIGN KEY ("service_uuid") REFERENCES "data"."services"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."service_offerings" ADD CONSTRAINT "service_offerings_operator_entity_uuid_fkey" FOREIGN KEY ("operator_entity_uuid") REFERENCES "configuration"."entities"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."ticket_status" ADD CONSTRAINT "ticket_status_rel_ticket_type_fkey" FOREIGN KEY ("rel_ticket_type") REFERENCES "configuration"."ticket_types"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."entities" ADD CONSTRAINT "entities_budget_approver_uuid_fkey" FOREIGN KEY ("budget_approver_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."entities" ADD CONSTRAINT "entities_rel_headquarters_location_fkey" FOREIGN KEY ("rel_headquarters_location") REFERENCES "configuration"."locations"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."entities" ADD CONSTRAINT "entities_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "configuration"."entities"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."locations" ADD CONSTRAINT "locations_primary_entity_uuid_fkey" FOREIGN KEY ("primary_entity_uuid") REFERENCES "configuration"."entities"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."locations" ADD CONSTRAINT "locations_field_service_group_uuid_fkey" FOREIGN KEY ("field_service_group_uuid") REFERENCES "configuration"."groups"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."locations" ADD CONSTRAINT "locations_rel_status_uuid_fkey" FOREIGN KEY ("rel_status_uuid") REFERENCES "configuration"."ticket_status"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."locations" ADD CONSTRAINT "locations_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "configuration"."locations"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."persons" ADD CONSTRAINT "persons_ref_entity_uuid_fkey" FOREIGN KEY ("ref_entity_uuid") REFERENCES "configuration"."entities"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."persons" ADD CONSTRAINT "persons_ref_location_uuid_fkey" FOREIGN KEY ("ref_location_uuid") REFERENCES "configuration"."locations"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."persons" ADD CONSTRAINT "persons_ref_approving_manager_uuid_fkey" FOREIGN KEY ("ref_approving_manager_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."groups" ADD CONSTRAINT "groups_rel_supervisor_fkey" FOREIGN KEY ("rel_supervisor") REFERENCES "configuration"."persons"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."groups" ADD CONSTRAINT "groups_rel_manager_fkey" FOREIGN KEY ("rel_manager") REFERENCES "configuration"."persons"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_persons_groups" ADD CONSTRAINT "rel_persons_groups_rel_member_fkey" FOREIGN KEY ("rel_member") REFERENCES "configuration"."persons"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_persons_groups" ADD CONSTRAINT "rel_persons_groups_rel_group_fkey" FOREIGN KEY ("rel_group") REFERENCES "configuration"."groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_persons_delegates" ADD CONSTRAINT "rel_persons_delegates_person_uuid_fkey" FOREIGN KEY ("person_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_persons_delegates" ADD CONSTRAINT "rel_persons_delegates_delegate_uuid_fkey" FOREIGN KEY ("delegate_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_entities_locations" ADD CONSTRAINT "rel_entities_locations_entity_uuid_fkey" FOREIGN KEY ("entity_uuid") REFERENCES "configuration"."entities"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_entities_locations" ADD CONSTRAINT "rel_entities_locations_location_uuid_fkey" FOREIGN KEY ("location_uuid") REFERENCES "configuration"."locations"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_persons_entities" ADD CONSTRAINT "rel_persons_entities_person_uuid_fkey" FOREIGN KEY ("person_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."rel_persons_entities" ADD CONSTRAINT "rel_persons_entities_entity_uuid_fkey" FOREIGN KEY ("entity_uuid") REFERENCES "configuration"."entities"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_configuration_item_uuid_fkey" FOREIGN KEY ("configuration_item_uuid") REFERENCES "data"."configuration_items"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_requested_by_uuid_fkey" FOREIGN KEY ("requested_by_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_requested_for_uuid_fkey" FOREIGN KEY ("requested_for_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_writer_uuid_fkey" FOREIGN KEY ("writer_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_ticket_type_code_fkey" FOREIGN KEY ("ticket_type_code") REFERENCES "configuration"."ticket_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."rel_parent_child_tickets" ADD CONSTRAINT "rel_parent_child_tickets_rel_parent_ticket_uuid_fkey" FOREIGN KEY ("rel_parent_ticket_uuid") REFERENCES "core"."tickets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."rel_parent_child_tickets" ADD CONSTRAINT "rel_parent_child_tickets_rel_child_ticket_uuid_fkey" FOREIGN KEY ("rel_child_ticket_uuid") REFERENCES "core"."tickets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."object_fields" ADD CONSTRAINT "object_fields_object_type_uuid_fkey" FOREIGN KEY ("object_type_uuid") REFERENCES "configuration"."object_types"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
