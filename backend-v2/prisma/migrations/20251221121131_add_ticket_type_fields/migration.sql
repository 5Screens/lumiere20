-- CreateTable
CREATE TABLE "configuration"."ticket_type_fields" (
    "uuid" UUID NOT NULL,
    "ticket_type_uuid" UUID NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "field_type" VARCHAR(50) NOT NULL,
    "data_type" VARCHAR(50) NOT NULL DEFAULT 'string',
    "show_in_table" BOOLEAN NOT NULL DEFAULT false,
    "show_in_form" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_readonly" BOOLEAN NOT NULL DEFAULT false,
    "min_width" VARCHAR(20),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "max_length" INTEGER,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "pattern" VARCHAR(255),
    "default_value" VARCHAR(255),
    "options_source" TEXT,
    "relation_object" VARCHAR(100),
    "relation_display" VARCHAR(100),
    "format_pattern" VARCHAR(100),
    "unit" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_type_fields_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "ticket_type_fields_ticket_type_uuid_display_order_idx" ON "configuration"."ticket_type_fields"("ticket_type_uuid", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_type_fields_ticket_type_uuid_field_name_key" ON "configuration"."ticket_type_fields"("ticket_type_uuid", "field_name");

-- AddForeignKey
ALTER TABLE "configuration"."ticket_type_fields" ADD CONSTRAINT "ticket_type_fields_ticket_type_uuid_fkey" FOREIGN KEY ("ticket_type_uuid") REFERENCES "configuration"."ticket_types"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
